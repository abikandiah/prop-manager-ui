import { useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { Badge } from '@abumble/design-system/components/Badge'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@abumble/design-system/components/Table'
import { DelayedLoadingFallback } from '@abumble/design-system/components/DelayedLoadingFallback'
import { FormDialog } from '@abumble/design-system/components/Dialog'
import { LeaseAgreementFormWizard } from '../forms/LeaseAgreementFormWizard'
import type { Lease } from '@/domain/lease'
import { LeaseStatus } from '@/domain/lease'
import { EntityActions, TableSkeleton } from '@/components/ui'
import {
	useDeleteLease,
	useLeasesByPropertyId,
	useLeasesByUnitId,
	useLeasesList,
} from '@/features/leases'
import { config } from '@/config'
import { formatCurrency, formatDate, formatEnumLabel } from '@/lib/format'

function statusVariant(status: LeaseStatus) {
	switch (status) {
		case LeaseStatus.ACTIVE:
			return 'success'
		case LeaseStatus.DRAFT:
			return 'secondary'
		case LeaseStatus.REVIEW:
			return 'warning'
		case LeaseStatus.TERMINATED:
		case LeaseStatus.EVICTED:
			return 'destructive'
		default:
			return 'default'
	}
}

function LeaseRowActions({
	lease,
	onEdit,
}: {
	lease: Lease
	onEdit: () => void
}) {
	const deleteLease = useDeleteLease()
	const isDraft = lease.status === LeaseStatus.DRAFT

	return (
		<EntityActions
			label="Lease actions"
			onEdit={isDraft ? onEdit : undefined}
			onDelete={() => {
				deleteLease.mutate(
					{ id: lease.id, unitId: lease.unitId, propertyId: lease.propertyId },
					{
						onSuccess: () => toast.success('Lease deleted'),
						onError: (err) =>
							toast.error(err.message || 'Failed to delete lease'),
					},
				)
			}}
			isDeletePending={deleteLease.isPending}
			deleteTitle="Delete lease?"
			deleteDescription="This lease will be removed. This can't be undone."
			stopTriggerPropagation
		/>
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
	const [editingLease, setEditingLease] = useState<Lease | null>(null)

	// Show error toast once per error instance, not on every re-render
	const lastErrorRef = useRef<unknown>(null)
	if (raw.isError && raw.error !== lastErrorRef.current) {
		lastErrorRef.current = raw.error
		toast.error(`Error loading leases: ${raw.error?.message || 'Unknown'}`)
	}
	if (!raw.isError) lastErrorRef.current = null

	const handleRowClick = (lease: Lease) => {
		navigate({
			to: '/leases/agreements/$leaseId',
			params: { leaseId: lease.id },
		})
	}

	const TABLE_COLS = 7

	const skeletonTable = (
		<TableSkeleton
			headers={['Template', 'Status', 'Rent', 'Due day', 'Start date', 'End date', '']}
			columnWidths={['w-24', 'w-24', 'w-24', 'w-24', 'w-24', 'w-24', '']}
		/>
	)

	return (
		<DelayedLoadingFallback
			isLoading={isLoading}
			delayMs={config.loadingFallbackDelayMs}
			fallback={skeletonTable}
		>
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
										colSpan={TABLE_COLS}
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
											<Badge variant={statusVariant(lease.status)}>
												{formatEnumLabel(lease.status)}
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

				{editingLease && editingLease.status === LeaseStatus.DRAFT && (
					<FormDialog
						open={!!editingLease}
						onOpenChange={(open) => { if (!open) setEditingLease(null) }}
						title="Edit lease"
						description="Update lease details. Only draft leases can be edited."
					>
						<LeaseAgreementFormWizard
							initialLease={editingLease}
							onSuccess={() => setEditingLease(null)}
							onCancel={() => setEditingLease(null)}
						/>
					</FormDialog>
				)}
			</>
		</DelayedLoadingFallback>
	)
}
