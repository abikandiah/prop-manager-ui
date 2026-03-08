import { isApiError } from '@/api/errors'
import { config } from '@/config'
import { LeaseStatus } from '@/domain/lease'
import { leaseStatusVariant } from '@/features/leases'
import { useMyLease } from '@/features/tenant-portal'
import { LeaseAssetsCard } from '@/features/tenant-portal/components/views/LeaseAssetsCard'
import { LeaseCoTenantsCard } from '@/features/tenant-portal/components/views/LeaseCoTenantsCard'
import { LeaseDocumentCard } from '@/features/tenant-portal/components/views/LeaseDocumentCard'
import { LeaseHomeCard } from '@/features/tenant-portal/components/views/LeaseHomeCard'
import { LeasePeriodCard } from '@/features/tenant-portal/components/views/LeasePeriodCard'
import { LeasePropertyCard } from '@/features/tenant-portal/components/views/LeasePropertyCard'
import { PendingActivationBanner } from '@/features/tenant-portal/components/views/PendingActivationBanner'
import { RentSummaryBar } from '@/features/tenant-portal/components/views/RentSummaryBar'
import { formatEnumLabel } from '@/lib/format'
import { Badge } from '@abumble/design-system/components/Badge'
import { BannerHeader } from '@abumble/design-system/components/BannerHeader'
import { DelayedLoadingFallback } from '@abumble/design-system/components/DelayedLoadingFallback'
import { Skeleton } from '@abumble/design-system/components/Skeleton'
import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute(
	'/_auth/_org/_dashboard/_tenant/my-lease/',
)({
	component: MyLeasePage,
})

function MyLeasePageSkeleton() {
	return (
		<div className="flex flex-col gap-6">
			<Skeleton className="h-16 w-full rounded-lg" />
			<Skeleton className="h-16 w-full rounded-lg" />
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className="lg:col-span-2 flex flex-col gap-6">
					<Skeleton className="h-40 w-full rounded-lg" />
					<Skeleton className="h-40 w-full rounded-lg" />
					<Skeleton className="h-48 w-full rounded-lg" />
				</div>
				<div className="flex flex-col gap-6">
					<Skeleton className="h-36 w-full rounded-lg" />
					<Skeleton className="h-40 w-full rounded-lg" />
				</div>
			</div>
		</div>
	)
}

function NoActiveLeaseState() {
	return (
		<div className="flex flex-col items-center gap-4 py-16 text-center">
			<p className="text-base text-foreground font-medium">
				You don't have an active lease right now.
			</p>
			<p className="text-sm text-muted-foreground max-w-sm">
				If you received a lease invite, check your email or visit your messages.
			</p>
			<Link
				to="/messages"
				className="text-sm text-primary underline-offset-4 hover:underline"
			>
				Go to Messages →
			</Link>
		</div>
	)
}

function MyLeasePage() {
	const { data, isLoading, error } = useMyLease()

	const is404 = error && isApiError(error) && error.status === 404

	const content = is404 ? (
		<NoActiveLeaseState />
	) : error ? (
		<p className="text-sm text-destructive py-8">
			Something went wrong loading your lease. Please try again.
		</p>
	) : data ? (
		<div className="flex flex-col gap-6">
			{data.lease.status !== LeaseStatus.ACTIVE && (
				<PendingActivationBanner
					leaseId={data.lease.id}
					status={data.lease.status}
					coTenants={data.coTenants}
					myLeaseTenantId={data.myLeaseTenantId}
					myLeaseTenantStatus={data.myLeaseTenantStatus}
				/>
			)}
			<div className="flex items-center gap-3">
				<h1 className="text-2xl font-bold text-foreground">
					{data.property.legalName}
				</h1>
				<Badge variant={leaseStatusVariant(data.lease.status)}>
					{formatEnumLabel(data.lease.status)}
				</Badge>
			</div>
			<RentSummaryBar lease={data.lease} />
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className="lg:col-span-2 flex flex-col gap-6">
					<LeaseHomeCard unit={data.unit} />
					<LeasePeriodCard lease={data.lease} />
					<LeaseAssetsCard assets={data.assets} />
					<LeaseDocumentCard lease={data.lease} />
				</div>
				<div className="flex flex-col gap-6">
					<LeasePropertyCard property={data.property} />
					<LeaseCoTenantsCard coTenants={data.coTenants} />
				</div>
			</div>
		</div>
	) : null

	return (
		<div className="flex flex-col gap-6">
			<BannerHeader
				title="My Lease"
				description="Your current lease, unit details, and everything you need to know about your tenancy."
			/>
			<DelayedLoadingFallback
				isLoading={isLoading}
				delayMs={config.loadingFallbackDelayMs}
				fallback={<MyLeasePageSkeleton />}
			>
				{content}
			</DelayedLoadingFallback>
		</div>
	)
}
