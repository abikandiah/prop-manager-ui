import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Skeleton } from '@abumble/design-system/components/Skeleton'
import { Badge } from '@abumble/design-system/components/Badge'
import { BannerHeader } from '@abumble/design-system/components/BannerHeader'
import { DelayedLoadingFallback } from '@abumble/design-system/components/DelayedLoadingFallback'
import { FormDialog } from '@abumble/design-system/components/Dialog'
import type { Lease } from '@/domain/lease'
import { useUnitDetail } from '@/features/units'
import { usePropDetail } from '@/features/props'
import {
	LeaseForm,
	LeaseStatusActions,
	useDeleteLease,
	useLeaseDetail,
} from '@/features/leases'
import { formatAddress, formatCurrency, formatDate } from '@/lib/format'
import { DetailField, EntityActions, TextLink } from '@/components/ui'
import { config } from '@/config'
import { CenteredEmptyState } from '@/components/CenteredEmptyState'

export const Route = createFileRoute('/leases/$leaseId')({
	component: LeaseDetailPage,
})

function LeaseActions({ lease, onEdit }: { lease: Lease; onEdit: () => void }) {
	const navigate = useNavigate()
	const deleteLease = useDeleteLease()
	const isDraft = lease.status === 'DRAFT'

	return (
		<EntityActions
			label="Lease actions"
			onEdit={isDraft ? onEdit : undefined}
			onDelete={() => {
				deleteLease.mutate(
					{
						id: lease.id,
						unitId: lease.unitId,
						propertyId: lease.propertyId,
					},
					{
						onSuccess: () => {
							toast.success('Lease deleted')
							navigate({ to: '/leases/templates' })
						},
						onError: (err) => {
							toast.error(err.message || 'Failed to delete lease')
						},
					},
				)
			}}
			isDeletePending={deleteLease.isPending}
			deleteTitle="Delete lease?"
			deleteDescription="This lease will be removed. This can't be undone."
		/>
	)
}

function LeaseDetailPage() {
	const { leaseId } = Route.useParams()

	const {
		data: lease,
		isLoading: leaseLoading,
		isError,
		error,
	} = useLeaseDetail(leaseId)

	const { data: unit, isLoading: unitLoading } = useUnitDetail(
		lease?.unitId ?? null,
	)
	const { data: property, isLoading: propertyLoading } = usePropDetail(
		lease?.propertyId ?? null,
	)

	const [editingLease, setEditingLease] = useState<Lease | null>(null)

	const isLoading = leaseLoading || unitLoading || propertyLoading

	useEffect(() => {
		if (isError) {
			toast.error(`Error loading lease: ${error.message}`)
		}
	}, [isError, error])

	const skeleton = (
		<div className="flex flex-col gap-6">
			<div className="flex items-center gap-2">
				<Skeleton className="h-9 w-9 rounded" />
				<Skeleton className="h-8 w-48" />
			</div>
			<div className="grid gap-x-8 gap-y-6 md:grid-cols-2 lg:grid-cols-3">
				{[1, 2, 3, 4, 5, 6].map((i) => (
					<div key={i} className="space-y-2">
						<Skeleton className="h-4 w-24" />
						<Skeleton className="h-6 w-full" />
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
			{isError || !lease ? (
				<CenteredEmptyState
					title="Lease not found"
					description={
						isError
							? error.message
							: 'The lease you were looking for was not found.'
					}
					action={<TextLink to="/leases/agreements">Back to leases</TextLink>}
				/>
			) : (
				<div className="flex flex-col gap-6">
					<BannerHeader
						linkComponent={Link}
						backLink={{ label: 'Back to leases' }}
						title={lease.leaseTemplateName || 'Lease'}
						description={
							<>
								{property?.legalName}
								{unit && ` · Unit ${unit.unitNumber}`}
								{` · ${formatCurrency(lease.rentAmount)}/mo`}
							</>
						}
						actions={
							<LeaseActions
								lease={lease}
								onEdit={() => setEditingLease(lease)}
							/>
						}
					/>

					{/* Status badge and actions */}
					<div className="flex flex-col gap-4">
						<div className="flex items-center gap-3">
							<Badge
								variant={
									lease.status === 'ACTIVE'
										? 'success'
										: lease.status === 'DRAFT'
											? 'secondary'
											: lease.status === 'PENDING_REVIEW'
												? 'warning'
												: 'default'
								}
							>
								{lease.status.replace(/_/g, ' ')}
							</Badge>
						</div>
						<LeaseStatusActions lease={lease} />
					</div>

					<div className="grid gap-x-8 gap-y-6 md:grid-cols-2 lg:grid-cols-3">
						{/* Group: Template Info */}
						<div className="space-y-6">
							<div>
								<DetailField
									label="Template"
									valueClassName="text-lg font-semibold text-foreground"
								>
									{lease.leaseTemplateName || '—'}
								</DetailField>
								{lease.leaseTemplateVersionTag && (
									<p className="text-sm text-muted-foreground">
										Version: {lease.leaseTemplateVersionTag}
									</p>
								)}
							</div>
							<div>
								<DetailField
									label="Property"
									valueClassName="text-foreground font-medium"
								>
									{property?.legalName ?? '—'}
								</DetailField>
								{property?.address && (
									<p className="text-sm text-muted-foreground">
										{formatAddress(property.address)}
									</p>
								)}
							</div>
							<DetailField
								label="Unit"
								valueClassName="text-foreground font-medium"
							>
								{unit?.unitNumber ?? '—'}
							</DetailField>
						</div>

						{/* Group: Lease Terms */}
						<div className="space-y-6">
							<DetailField label="Start Date">
								{formatDate(lease.startDate)}
							</DetailField>
							<DetailField label="End Date">
								{formatDate(lease.endDate)}
							</DetailField>
							<DetailField label="Created">
								{formatDate(lease.createdAt)}
							</DetailField>
						</div>

						{/* Group: Financials */}
						<div className="space-y-6">
							<DetailField label="Rent Amount">
								{formatCurrency(lease.rentAmount)}
							</DetailField>
							<DetailField label="Rent Due Day">
								Day {lease.rentDueDay} of month
							</DetailField>
							<DetailField label="Security Deposit">
								{lease.securityDepositHeld != null
									? formatCurrency(lease.securityDepositHeld)
									: '—'}
							</DetailField>
						</div>

						{/* Group: Late Fees & Notice */}
						<div className="space-y-6">
							<DetailField label="Late Fee Type">
								{lease.lateFeeType?.replace(/_/g, ' ') || '—'}
							</DetailField>
							<DetailField label="Late Fee Amount">
								{lease.lateFeeAmount != null
									? lease.lateFeeType === 'PERCENTAGE'
										? `${lease.lateFeeAmount}%`
										: formatCurrency(lease.lateFeeAmount)
									: '—'}
							</DetailField>
							<DetailField label="Notice Period">
								{lease.noticePeriodDays != null
									? `${lease.noticePeriodDays} days`
									: '—'}
							</DetailField>
						</div>

						{/* Group: Documents */}
						{(lease.executedContentMarkdown || lease.signedPdfUrl) && (
							<div className="space-y-6">
								{lease.executedContentMarkdown && (
									<DetailField label="Executed Content">
										Available
									</DetailField>
								)}
								{lease.signedPdfUrl && (
									<DetailField label="Signed PDF">
										<a
											href={lease.signedPdfUrl}
											target="_blank"
											rel="noopener noreferrer"
											className="text-primary hover:underline"
										>
											View PDF
										</a>
									</DetailField>
								)}
							</div>
						)}
					</div>

					{editingLease && editingLease.status === 'DRAFT' && (
						<FormDialog
							open={!!editingLease}
							onOpenChange={() => setEditingLease(null)}
							title="Edit lease"
							description="Update lease details. Only DRAFT leases can be edited."
						>
							<LeaseForm
								propertyId={lease.propertyId}
								unitId={lease.unitId}
								initialLease={editingLease}
								onSuccess={() => setEditingLease(null)}
								onCancel={() => setEditingLease(null)}
								submitLabel="Save"
							/>
						</FormDialog>
					)}
				</div>
			)}
		</DelayedLoadingFallback>
	)
}
