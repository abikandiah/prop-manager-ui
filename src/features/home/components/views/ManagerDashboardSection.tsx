import { ActivityFeed } from '@/features/activity'
import { SectionCard } from '@/components/ui/SectionCard'
import { formatCurrency } from '@/lib/format'
import { Building2, FileCheck, FileSignature, TrendingUp } from 'lucide-react'
import { useDashboardStats } from '../../hooks'
import { ExpiringLeasesTable } from './ExpiringLeasesTable'
import { MetricCard } from './MetricCard'
import { PortfolioHealthChart } from './PortfolioHealthChart'
import { RevenueByPropertyChart } from './RevenueByPropertyChart'
import { UnitMixChart } from './UnitMixChart'

export function ManagerDashboardSection() {
	const { stats, isLoading } = useDashboardStats()

	return (
		<div className="flex flex-col gap-6">
			{/* KPI Row */}
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<MetricCard
					title="Occupancy Rate"
					value={
						isLoading ? '—' : `${stats ? Math.round(stats.occupancyRate) : 0}%`
					}
					subtitle={`${stats?.totalUnits ?? 0} total units`}
					icon={Building2}
					isLoading={isLoading}
				/>
				<MetricCard
					title="Projected Revenue"
					value={isLoading ? '—' : formatCurrency(stats?.monthlyRevenue ?? 0)}
					subtitle="Active leases · monthly"
					icon={TrendingUp}
					isLoading={isLoading}
				/>
				<MetricCard
					title="Lease Renewals"
					value={isLoading ? '—' : (stats?.leaseRenewals ?? 0)}
					subtitle="Expiring within 60 days"
					icon={FileCheck}
					isLoading={isLoading}
				/>
				<MetricCard
					title="Unsigned Leases"
					value={isLoading ? '—' : (stats?.pendingActions ?? 0)}
					subtitle="Draft or under review"
					icon={FileSignature}
					isLoading={isLoading}
				/>
			</div>

			{/* Charts Row */}
			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
				<PortfolioHealthChart
					data={stats?.portfolioHealth ?? []}
					isLoading={isLoading}
				/>
				<RevenueByPropertyChart
					data={stats?.revenueByProperty ?? []}
					isLoading={isLoading}
				/>
				<UnitMixChart data={stats?.unitMix ?? []} isLoading={isLoading} />
			</div>

			{/* Expiring Leases */}
			<ExpiringLeasesTable
				leases={stats?.expiringLeases ?? []}
				isLoading={isLoading}
			/>

			{/* Recent Activity */}
			<SectionCard title="Recent Activity" contentClassName="px-0 pb-2">
				<ActivityFeed limit={10} />
			</SectionCard>
		</div>
	)
}
