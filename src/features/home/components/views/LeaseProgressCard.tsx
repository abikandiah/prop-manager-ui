import { Skeleton } from '@abumble/design-system/components/Skeleton'
import { SectionCard } from '@/components/ui/SectionCard'
import { formatCurrency, formatDate } from '@/lib/format'
import type { TenantDashboardStats } from '../../hooks'

interface LeaseProgressCardProps {
	stats: TenantDashboardStats | null
	isLoading?: boolean
}

export function LeaseProgressCard({
	stats,
	isLoading,
}: LeaseProgressCardProps) {
	if (isLoading) {
		return (
			<div className="grid gap-4 sm:grid-cols-2">
				<SectionCard contentClassName="space-y-3 p-5">
					<Skeleton className="h-4 w-24" />
					<Skeleton className="h-3 w-full rounded-full" />
					<Skeleton className="h-4 w-32" />
				</SectionCard>
				<SectionCard contentClassName="p-5">
					<Skeleton className="mb-2 h-4 w-24" />
					<Skeleton className="h-8 w-28" />
				</SectionCard>
			</div>
		)
	}

	if (!stats) {
		return (
			<SectionCard contentClassName="p-5">
				<p className="text-sm text-muted-foreground">
					You don't have an active lease yet. Contact your property manager to
					get started.
				</p>
			</SectionCard>
		)
	}

	const { leaseView, progressPct, daysRemaining, nextRentDue } = stats
	const { lease, property, unit } = leaseView

	return (
		<div className="grid gap-4 sm:grid-cols-2">
			{/* Lease Progress */}
			<SectionCard title="My Lease" contentClassName="space-y-3 p-5">
				<div className="text-sm text-muted-foreground">
					{property.legalName} · Unit {unit.unitNumber}
				</div>
				<div>
					<div className="mb-1 flex justify-between text-xs text-muted-foreground">
						<span>Started {formatDate(lease.startDate)}</span>
						<span>{daysRemaining}d remaining</span>
					</div>
					<div className="h-2 w-full overflow-hidden rounded-full bg-muted">
						<div
							className="h-full rounded-full bg-primary transition-all"
							style={{ width: `${progressPct}%` }}
						/>
					</div>
					<div className="mt-1 text-xs text-muted-foreground">
						Ends {formatDate(lease.endDate)}
					</div>
				</div>
			</SectionCard>

			{/* Next Rent Due */}
			<SectionCard title="Next Rent Due" contentClassName="p-5">
				<p className="text-2xl font-semibold">
					{formatCurrency(lease.rentAmount)}
				</p>
				<p className="text-sm text-muted-foreground">
					Due{' '}
					{nextRentDue.toLocaleDateString(undefined, {
						month: 'short',
						day: 'numeric',
						year: 'numeric',
					})}
				</p>
			</SectionCard>
		</div>
	)
}
