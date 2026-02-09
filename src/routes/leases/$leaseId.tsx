import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Skeleton } from '@abumble/design-system/components/Skeleton'
import type { Lease } from '@/domain/lease'
import { Badge } from '@/components/ui/badge'
import { useUnitDetail } from '@/features/units'
import { usePropDetail } from '@/features/props'
import {
	LeaseForm,
	LeaseStatusActions,
	useDeleteLease,
	useLeaseDetail,
} from '@/features/leases'
import { formatAddress, formatCurrency, formatDate } from '@/lib/format'
import {
	ActionsPopover,
	BannerHeader,
	ConfirmDeleteDialog,
	DelayedLoadingFallback,
	FormDialog,
	TextLink,
} from '@/components/ui'
import { CenteredEmptyState } from '@/components/CenteredEmptyState'

export const Route = createFileRoute('/leases/$leaseId')({
	component: LeaseDetailPage,
})

function LeaseActions({ lease, onEdit }: { lease: Lease; onEdit: () => void }) {
	const navigate = useNavigate()
	const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
	const deleteLease = useDeleteLease()
	const isDraft = lease.status === 'DRAFT'

	const handleDeleteConfirm = () => {
		deleteLease.mutate(
			{
				id: lease.id,
				unitId: lease.unitId,
				propertyId: lease.propertyId,
			},
			{
				onSuccess: () => {
					setDeleteConfirmOpen(false)
					toast.success('Lease deleted')
					navigate({ to: '/leases/templates' })
				},
				onError: (err) => {
					toast.error(err.message || 'Failed to delete lease')
				},
			},
		)
	}

	const handleEdit = () => {
		if (isDraft) {
			onEdit()
		} else {
			toast.error('Only DRAFT leases can be edited')
		}
	}

	return (
		<>
			<ActionsPopover
				label="Lease actions"
				onEdit={handleEdit}
				onDelete={() => setDeleteConfirmOpen(true)}
				isDeleteDisabled={deleteLease.isPending}
			/>
			<ConfirmDeleteDialog
				open={deleteConfirmOpen}
				onOpenChange={setDeleteConfirmOpen}
				title="Delete lease?"
				description="This lease will be removed. This can't be undone."
				onConfirm={handleDeleteConfirm}
				isPending={deleteLease.isPending}
			/>
		</>
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
		<DelayedLoadingFallback isLoading={isLoading} fallback={skeleton}>
			{isError || !lease ? (
				<CenteredEmptyState
					title="Lease not found"
					description={
						isError
							? error.message
							: 'The lease you were looking for was not found.'
					}
					action={<TextLink to="/leases/signed">Back to leases</TextLink>}
				/>
			) : (
				<div className="flex flex-col gap-6">
					<BannerHeader
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
								<label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
									Template
								</label>
								<p className="mt-1 text-lg font-semibold text-foreground">
									{lease.leaseTemplateName || '—'}
								</p>
								{lease.leaseTemplateVersionTag && (
									<p className="text-sm text-muted-foreground">
										Version: {lease.leaseTemplateVersionTag}
									</p>
								)}
							</div>
							<div>
								<label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
									Property
								</label>
								<p className="mt-1 text-foreground font-medium">
									{property?.legalName ?? '—'}
								</p>
								{property?.address && (
									<p className="text-sm text-muted-foreground">
										{formatAddress(property.address)}
									</p>
								)}
							</div>
							<div>
								<label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
									Unit
								</label>
								<p className="mt-1 text-foreground font-medium">
									{unit?.unitNumber ?? '—'}
								</p>
							</div>
						</div>

						{/* Group: Lease Terms */}
						<div className="space-y-6">
							<div>
								<label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
									Start Date
								</label>
								<p className="mt-1 text-foreground">
									{formatDate(lease.startDate)}
								</p>
							</div>
							<div>
								<label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
									End Date
								</label>
								<p className="mt-1 text-foreground">
									{formatDate(lease.endDate)}
								</p>
							</div>
							<div>
								<label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
									Created
								</label>
								<p className="mt-1 text-foreground">
									{formatDate(lease.createdAt)}
								</p>
							</div>
						</div>

						{/* Group: Financials */}
						<div className="space-y-6">
							<div>
								<label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
									Rent Amount
								</label>
								<p className="mt-1 text-foreground">
									{formatCurrency(lease.rentAmount)}
								</p>
							</div>
							<div>
								<label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
									Rent Due Day
								</label>
								<p className="mt-1 text-foreground">
									Day {lease.rentDueDay} of month
								</p>
							</div>
							<div>
								<label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
									Security Deposit
								</label>
								<p className="mt-1 text-foreground">
									{lease.securityDepositHeld != null
										? formatCurrency(lease.securityDepositHeld)
										: '—'}
								</p>
							</div>
						</div>

						{/* Group: Late Fees & Notice */}
						<div className="space-y-6">
							<div>
								<label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
									Late Fee Type
								</label>
								<p className="mt-1 text-foreground">
									{lease.lateFeeType?.replace(/_/g, ' ') || '—'}
								</p>
							</div>
							<div>
								<label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
									Late Fee Amount
								</label>
								<p className="mt-1 text-foreground">
									{lease.lateFeeAmount != null
										? lease.lateFeeType === 'PERCENTAGE'
											? `${lease.lateFeeAmount}%`
											: formatCurrency(lease.lateFeeAmount)
										: '—'}
								</p>
							</div>
							<div>
								<label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
									Notice Period
								</label>
								<p className="mt-1 text-foreground">
									{lease.noticePeriodDays != null
										? `${lease.noticePeriodDays} days`
										: '—'}
								</p>
							</div>
						</div>

						{/* Group: Documents */}
						{(lease.executedContentMarkdown || lease.signedPdfUrl) && (
							<div className="space-y-6">
								{lease.executedContentMarkdown && (
									<div>
										<label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
											Executed Content
										</label>
										<p className="mt-1 text-foreground">Available</p>
									</div>
								)}
								{lease.signedPdfUrl && (
									<div>
										<label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
											Signed PDF
										</label>
										<p className="mt-1 text-foreground">
											<a
												href={lease.signedPdfUrl}
												target="_blank"
												rel="noopener noreferrer"
												className="text-primary hover:underline"
											>
												View PDF
											</a>
										</p>
									</div>
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
