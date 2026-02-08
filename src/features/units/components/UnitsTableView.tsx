import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { Skeleton } from '@abumble/design-system/components/Skeleton'
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
import { useUnitsByPropId, useDeleteUnit } from '@/features/units/hooks'
import type { Unit } from '@/features/units/units'
import { formatCurrency } from '@/lib/format'
import { UnitForm } from './UnitForm.tsx'

function UnitRowActions({ unit, onEdit }: { unit: Unit; onEdit: () => void }) {
	const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
	const deleteUnit = useDeleteUnit()

	const handleDeleteConfirm = () => {
		deleteUnit.mutate(unit.id, {
			onSuccess: () => {
				setDeleteConfirmOpen(false)
				toast.success('Unit deleted')
			},
			onError: (err) => {
				toast.error(err?.message ?? 'Failed to delete unit')
			},
		})
	}

	return (
		<>
			<ActionsPopover
				label="Unit actions"
				onEdit={onEdit}
				onDelete={() => setDeleteConfirmOpen(true)}
				isDeleteDisabled={deleteUnit.isPending}
				stopTriggerPropagation
			/>
			<ConfirmDeleteDialog
				open={deleteConfirmOpen}
				onOpenChange={setDeleteConfirmOpen}
				title="Delete unit?"
				description={
					<>
						Unit {unit.unitNumber} will be removed. This can&apos;t be undone.
					</>
				}
				onConfirm={handleDeleteConfirm}
				isPending={deleteUnit.isPending}
			/>
		</>
	)
}

export interface UnitsTableViewProps {
	propId: string
}

export function UnitsTableView({ propId }: UnitsTableViewProps) {
	const navigate = useNavigate()
	const { data: units, isLoading, isError, error } = useUnitsByPropId(propId)
	const [editingUnit, setEditingUnit] = useState<Unit | null>(null)

	const handleRowClick = (unitId: string) => {
		navigate({
			to: '/props/$id/units/$unitId',
			params: { id: propId, unitId },
		})
	}

	useEffect(() => {
		if (isError) {
			toast.error(`Error loading units: ${error?.message ?? 'Unknown'}`)
		}
	}, [isError, error])

	const skeletonTable = (
		<div className="rounded border bg-card overflow-hidden">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Unit #</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Rent</TableHead>
						<TableHead>Beds</TableHead>
						<TableHead>Baths</TableHead>
						<TableHead>Sq ft</TableHead>
						<TableHead className="w-12" />
					</TableRow>
				</TableHeader>
				<TableBody>
					{Array.from({ length: 3 }).map((_, i) => (
						<TableRow key={i}>
							<TableCell>
								<Skeleton className="h-6 w-16" />
							</TableCell>
							<TableCell>
								<Skeleton className="h-6 w-24" />
							</TableCell>
							<TableCell>
								<Skeleton className="h-6 w-20" />
							</TableCell>
							<TableCell>
								<Skeleton className="h-6 w-8" />
							</TableCell>
							<TableCell>
								<Skeleton className="h-6 w-8" />
							</TableCell>
							<TableCell>
								<Skeleton className="h-6 w-14" />
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
							<TableHead>Unit #</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Rent</TableHead>
							<TableHead>Beds</TableHead>
							<TableHead>Baths</TableHead>
							<TableHead>Sq ft</TableHead>
							<TableHead className="w-12" />
						</TableRow>
					</TableHeader>
					<TableBody>
						{!units || units.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={7}
									className="h-24 text-center text-muted-foreground"
								>
									No units yet. Add one above.
								</TableCell>
							</TableRow>
						) : (
							units.map((unit) => (
								<TableRow
									key={unit.id}
									className="cursor-pointer hover:bg-muted/50"
									onClick={() => handleRowClick(unit.id)}
								>
									<TableCell className="font-medium">
										{unit.unitNumber}
									</TableCell>
									<TableCell className="text-muted-foreground">
										{unit.status.replace(/_/g, ' ')}
									</TableCell>
									<TableCell className="text-muted-foreground">
										{formatCurrency(unit.rentAmount)}
									</TableCell>
									<TableCell className="text-muted-foreground">
										{unit.bedrooms ?? '—'}
									</TableCell>
									<TableCell className="text-muted-foreground">
										{unit.bathrooms ?? '—'}
									</TableCell>
									<TableCell className="text-muted-foreground">
										{unit.squareFootage != null
											? `${unit.squareFootage} sq ft`
											: '—'}
									</TableCell>
									<TableCell onClick={(e) => e.stopPropagation()}>
										<UnitRowActions
											unit={unit}
											onEdit={() => setEditingUnit(unit)}
										/>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>

			{editingUnit && (
				<FormDialog
					open={!!editingUnit}
					onOpenChange={() => setEditingUnit(null)}
					title="Edit unit"
					description={`Update unit ${editingUnit.unitNumber} details.`}
				>
					<UnitForm
						propId={propId}
						initialUnit={editingUnit}
						onSuccess={() => setEditingUnit(null)}
						onCancel={() => setEditingUnit(null)}
						submitLabel="Save"
					/>
				</FormDialog>
			)}
			</>
		</DelayedLoadingFallback>
	)
}
