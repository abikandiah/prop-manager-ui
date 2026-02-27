import { CenteredEmptyState } from '@/components/CenteredEmptyState'
import { DetailField, TextLink } from '@/components/ui'
import { config } from '@/config'
import { useTenantDetail } from '@/features/tenants'
import { formatDate } from '@/lib/format'
import { BannerHeader } from '@abumble/design-system/components/BannerHeader'
import { DelayedLoadingFallback } from '@abumble/design-system/components/DelayedLoadingFallback'
import { Skeleton } from '@abumble/design-system/components/Skeleton'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'
import { toast } from 'sonner'

export const Route = createFileRoute('/people/tenants/$tenantId')({
	component: TenantDetailPage,
})

function TenantDetailPage() {
	const { tenantId } = Route.useParams()
	const { data: tenant, isLoading, isError, error } = useTenantDetail(tenantId)

	useEffect(() => {
		if (isError) {
			toast.error(`Error loading tenant: ${error.message || 'Unknown'}`)
		}
	}, [isError, error])

	const skeleton = (
		<div className="flex flex-col gap-6">
			<div className="flex items-center gap-2">
				<Skeleton className="h-8 w-48" />
			</div>
			<div className="grid gap-x-8 gap-y-6 md:grid-cols-2">
				{[1, 2, 3, 4].map((i) => (
					<div key={i} className="space-y-2">
						<Skeleton className="h-4 w-24" />
						<Skeleton className="h-6 w-48" />
					</div>
				))}
			</div>
		</div>
	)

	return (
		<DelayedLoadingFallback
			isLoading={isLoading}
			delayMs={config.loadingFallbackDelayMs}
			fallback={skeleton}
		>
			{isError || !tenant ? (
				<CenteredEmptyState
					title="Tenant not found"
					description={
						isError
							? error.message || 'Failed to load tenant'
							: 'The tenant you were looking for was not found.'
					}
					action={<TextLink to="/tenants">Back to tenants</TextLink>}
				/>
			) : (
				<div className="flex flex-col gap-6">
					<BannerHeader
						linkComponent={Link}
						backLink={{ label: 'Back to tenants' }}
						title={tenant.name}
						description={tenant.email}
					/>

					<div className="grid gap-x-8 gap-y-6 md:grid-cols-2">
						{/* Contact info */}
						<DetailField label="Email">{tenant.email}</DetailField>
						<DetailField label="Phone">{tenant.phoneNumber ?? '—'}</DetailField>

						{/* Emergency contact */}
						<DetailField label="Emergency contact">
							{tenant.emergencyContactName ?? '—'}
						</DetailField>
						<DetailField label="Emergency phone">
							{tenant.emergencyContactPhone ?? '—'}
						</DetailField>

						{/* Pets */}
						<DetailField label="Has pets">
							{tenant.hasPets == null ? '—' : tenant.hasPets ? 'Yes' : 'No'}
						</DetailField>
						{tenant.hasPets && tenant.petDescription && (
							<DetailField label="Pet description">
								{tenant.petDescription}
							</DetailField>
						)}

						{/* Vehicle */}
						<DetailField label="Vehicle">
							{tenant.vehicleInfo ?? '—'}
						</DetailField>

						{/* Joined */}
						<DetailField label="Joined">
							{formatDate(tenant.createdAt)}
						</DetailField>

						{/* Notes */}
						{tenant.notes && (
							<div className="md:col-span-2 border-t pt-4">
								<DetailField
									label='Notes'
									valueClassName="text-foreground whitespace-pre-wrap leading-relaxed"
								>
									{tenant.notes}
								</DetailField>
							</div>
						)}
					</div>
				</div>
			)}
		</DelayedLoadingFallback>
	)
}
