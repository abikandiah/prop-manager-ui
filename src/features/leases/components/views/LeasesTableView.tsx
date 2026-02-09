import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { Skeleton } from '@abumble/design-system/components/Skeleton'
import { LeaseForm } from '../forms/LeaseForm'
import type { Lease, LeaseStatus } from '@/domain/lease'
import { Badge } from '@/components/ui/badge'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import {
	ActionsPopover,
	ConfirmDeleteDialog,
	DelayedLoadingFallback,
	FormDialog,
} from '@/components/ui'
import {
	useDeleteLease,
	useLeasesByPropertyId,
	useLeasesByUnitId,
	useLeasesList,
} from '@/features/leases'
import { formatCurrency, formatDate } from '@/lib/format'

function LeaseRowActions({
	lease,
	onEdit,
}: {
	lease: Lease
	onEdit: () => void
}) {
	const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
	const deleteLease = useDeleteLease()
	const isDraft = lease.status === 'DRAFT'

	const handleDeleteConfirm = () => {
		deleteLease.mutate(
			{ id: lease.id, unitId: lease.unitId, propertyId: lease.propertyId },
			{
				onSuccess: () => {
					setDeleteConfirmOpen(false)
					toast.success('Lease deleted')
				},
				onError: (err) => {
					toast.error(err.message || 'Failed to delete lease')
				},
			},
		)
	}

	return (
		<>
			<ActionsPopover
				label="Lease actions"
				onEdit={isDraft ? onEdit : undefined}
				onDelete={() => setDeleteConfirmOpen(true)}
				isDeleteDisabled={deleteLease.isPending}
				stopTriggerPropagation
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

export interface LeasesTableViewProps {
	propertyId?: string
	unitId?: string
	/** When set, show all leases filtered by this status (e.g. ACTIVE for signed page). */
	status?: LeaseStatus
}

export function LeasesTableView({
	propertyId,
	unitId,
	status,
}: LeasesTableViewProps) {
	const navigate = useNavigate()
	const leasesByUnit = useLeasesByUnitId(unitId ?? null)
	const leasesByProperty = useLeasesByPropertyId(propertyId ?? null)
	const allLeases = useLeasesList()

	const raw = unitId
		? leasesByUnit
		: propertyId
			? leasesByProperty
			: status != null
				? allLeases
				: { data: [], isLoading: false, isError: false, error: null }

	const leases =
		status != null && raw.data != null
			? raw.data.filter((l) => l.status === status)
			: (raw.data ?? [])
	const isLoading = raw.isLoading
	const isError = raw.isError
	const error = raw.error
	const [editingLease, setEditingLease] = useState<Lease | null>(null)

	const handleRowClick = (lease: Lease) => {
		navigate({
			to: '/leases/$leaseId',
			params: { leaseId: lease.id },
		})
	}

	useEffect(() => {
		if (isError) {
			toast.error(`Error loading leases: ${error?.message || 'Unknown'}`)
		}
	}, [isError, error])

	const skeletonTable = (
		<div className="rounded border bg-card overflow-hidden">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Template</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Rent</TableHead>
						<TableHead>Due day</TableHead>
						<TableHead>Start date</TableHead>
						<TableHead>End date</TableHead>
						<TableHead className="w-12" />
					</TableRow>
				</TableHeader>
				<TableBody>
					{Array.from({ length: 3 }).map((_, i) => (
						<TableRow key={i}>
							<TableCell>
								<Skeleton className="h-6 w-32" />
							</TableCell>
							<TableCell>
								<Skeleton className="h-6 w-24" />
							</TableCell>
							<TableCell>
								<Skeleton className="h-6 w-20" />
							</TableCell>
							<TableCell>
								<Skeleton className="h-6 w-12" />
							</TableCell>
							<TableCell>
								<Skeleton className="h-6 w-24" />
							</TableCell>
							<TableCell>
								<Skeleton className="h-6 w-24" />
							</TableCell>
							<TableCell />
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	)

	return (
		<DelayedLoadingFallback isLoading={isLoading} fallback={skeletonTable}>
			<>
				<div className="rounded border bg-card overflow-hidden">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Template</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Rent</TableHead>
								<TableHead>Due day</TableHead>
								<TableHead>Start date</TableHead>
								<TableHead>End date</TableHead>
								<TableHead className="w-12" />
							</TableRow>
						</TableHeader>
						<TableBody>
							{leases.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={7}
										className="h-24 text-center text-muted-foreground"
									>
										No leases yet. Add one above.
									</TableCell>
								</TableRow>
							) : (
								leases.map((lease) => (
									<TableRow
										key={lease.id}
										className="cursor-pointer hover:bg-muted/50"
										onClick={() => handleRowClick(lease)}
									>
										<TableCell className="font-medium">
											{lease.leaseTemplateName || '—'}
										</TableCell>
										<TableCell>
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
										</TableCell>
										<TableCell className="text-muted-foreground">
											{formatCurrency(lease.rentAmount)}
										</TableCell>
										<TableCell className="text-muted-foreground">
											{lease.rentDueDay}
										</TableCell>
										<TableCell className="text-muted-foreground">
											{formatDate(lease.startDate)}
										</TableCell>
										<TableCell className="text-muted-foreground">
											{formatDate(lease.endDate)}
										</TableCell>
										<TableCell onClick={(e) => e.stopPropagation()}>
											<LeaseRowActions
												lease={lease}
												onEdit={() => setEditingLease(lease)}
											/>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</div>

				{editingLease && editingLease.status === 'DRAFT' && (
					<FormDialog
						open={!!editingLease}
						onOpenChange={() => setEditingLease(null)}
						title="Edit lease"
						description="Update lease details. Only DRAFT leases can be edited."
					>
						<LeaseForm
							propertyId={propertyId}
							unitId={unitId}
							initialLease={editingLease}
							onSuccess={() => setEditingLease(null)}
							onCancel={() => setEditingLease(null)}
							submitLabel="Save"
						/>
					</FormDialog>
				)}
			</>
		</DelayedLoadingFallback>
	)
}
