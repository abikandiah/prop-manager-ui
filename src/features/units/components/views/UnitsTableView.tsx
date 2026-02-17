import { useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
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
import { UnitForm } from '../forms/UnitForm'
import type { Unit } from '@/domain/unit'
import { EntityActions, TableSkeleton } from '@/components/ui'
import { useDeleteUnit, useUnitsByPropId, useUnitsList } from '@/features/units'
import { config } from '@/config'
import { formatCurrency, formatEnumLabel } from '@/lib/format'

function UnitRowActions({ unit, onEdit }: { unit: Unit; onEdit: () => void }) {
	const deleteUnit = useDeleteUnit()

	return (
		<EntityActions
			label="Unit actions"
			onEdit={onEdit}
			onDelete={() => {
				deleteUnit.mutate(
					{ id: unit.id, propertyId: unit.propertyId },
					{
						onSuccess: () => toast.success('Unit deleted'),
						onError: (err) =>
							toast.error(err.message || 'Failed to delete unit'),
					},
				)
			}}
			isDeletePending={deleteUnit.isPending}
			deleteTitle="Delete unit?"
			deleteDescription={
				<>Unit {unit.unitNumber} will be removed. This can&apos;t be undone.</>
			}
			stopTriggerPropagation
		/>
	)
}

export interface UnitsTableViewProps {
	propId?: string
}

export function UnitsTableView({ propId }: UnitsTableViewProps) {
	const navigate = useNavigate()
	const unitsByProp = useUnitsByPropId(propId ?? null)
	const unitsAll = useUnitsList()

	const {
		data: units,
		isLoading,
		isError,
		error,
	} = propId ? unitsByProp : unitsAll
	const [editingUnit, setEditingUnit] = useState<Unit | null>(null)

	const handleRowClick = (unit: Unit) => {
		navigate({
			to: '/units/$unitId',
			params: { unitId: unit.id },
		})
	}

	// Show error toast once per error instance, not on every re-render
	const lastErrorRef = useRef<unknown>(null)
	if (isError && error !== lastErrorRef.current) {
		lastErrorRef.current = error
		toast.error(`Error loading units: ${error?.message || 'Unknown'}`)
	}
	if (!isError) lastErrorRef.current = null

	const skeletonTable = (
		<TableSkeleton
			headers={['Unit #', 'Status', 'Rent', 'Beds', 'Baths', 'Sq ft', '']}
			columnWidths={['w-16', 'w-24', 'w-20', 'w-8', 'w-8', 'w-14', '']}
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
										onClick={() => handleRowClick(unit)}
									>
										<TableCell className="font-medium">
											{unit.unitNumber}
										</TableCell>
										<TableCell className="text-muted-foreground">
											{formatEnumLabel(unit.status)}
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
