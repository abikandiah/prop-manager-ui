import { ActivityEventType } from '@/domain/activity'
import { ActivityFeed } from '@/features/activity'
import { SectionCard } from '@/components/ui/SectionCard'
import { useTenantDashboardStats } from '../../hooks'
import { LeaseProgressCard } from './LeaseProgressCard'

// Stable reference — defined at module level to avoid re-renders
const LEASE_EVENTS: ActivityEventType[] = [
	ActivityEventType.LEASE_SUBMITTED_FOR_REVIEW,
	ActivityEventType.LEASE_TENANT_SIGNED,
	ActivityEventType.LEASE_ALL_TENANTS_SIGNED,
	ActivityEventType.LEASE_ACTIVATED,
	ActivityEventType.LEASE_EXPIRING_SOON,
	ActivityEventType.LEASE_EXPIRED,
	ActivityEventType.LEASE_TERMINATED,
	ActivityEventType.LEASE_EVICTED,
]

export function TenantDashboardSection() {
	const { stats, isLoading } = useTenantDashboardStats()

	return (
		<div className="flex flex-col gap-6">
			{/* Lease Status */}
			<LeaseProgressCard stats={stats} isLoading={isLoading} />

			{/* Activity Feed — shows error state until GET /api/tenant/activity is built.
			    Tenants lack PORTFOLIO READ permission required by the current /api/activity endpoint. */}
			<SectionCard title="Recent Activity" contentClassName="px-0 pb-2">
				<ActivityFeed filter={LEASE_EVENTS} limit={5} />
			</SectionCard>
		</div>
	)
}
