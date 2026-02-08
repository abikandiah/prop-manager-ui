import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState, useMemo } from 'react'
import { toast } from 'sonner'
import { Skeleton } from '@abumble/design-system/components/Skeleton'
import { usePropDetail } from '@/features/props/hooks'
import { useUnitDetail, useDeleteUnit } from '@/features/units/hooks'
import type { Unit } from '@/features/units/units'
import { UnitForm } from '@/features/units/components'
import { formatCurrency } from '@/lib/format'
import {
	ActionsPopover,
	BannerHeader,
	ConfirmDeleteDialog,
	DelayedLoadingFallback,
	FieldsTable,
	FormDialog,
	TextLink,
} from '@/components/ui'
import { CenteredEmptyState } from '@/components/CenteredEmptyState'

export const Route = createFileRoute('/props/$id/units/$unitId')({
	component: UnitDetailPage,
})

function UnitActions({
	unit,
	propId,
	onEdit,
}: {
	unit: Unit
	propId: string
	onEdit: () => void
}) {
	const navigate = useNavigate()
	const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
	const deleteUnit = useDeleteUnit()

	const handleDeleteConfirm = () => {
		deleteUnit.mutate(
			{ id: unit.id, propertyId: unit.propertyId },
			{
				onSuccess: () => {
					setDeleteConfirmOpen(false)
					toast.success('Unit deleted')
					navigate({ to: '/props/$id', params: { id: propId } })
				},
				onError: (err) => {
					toast.error(err?.message ?? 'Failed to delete unit')
				},
			},
		)
	}

	return (
		<>
			<ActionsPopover
				label="Unit actions"
				onEdit={onEdit}
				onDelete={() => setDeleteConfirmOpen(true)}
				isDeleteDisabled={deleteUnit.isPending}
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

function UnitDetailPage() {
	const { id: propId, unitId } = Route.useParams()

	const { data: prop, isLoading: propLoading } = usePropDetail(propId)
	const {
		data: unit,
		isLoading: unitLoading,
		isError,
		error,
	} = useUnitDetail(unitId)
	const [editingUnit, setEditingUnit] = useState<Unit | null>(null)

	const isLoading = propLoading || unitLoading

	useEffect(() => {
		if (isError) {
			toast.error(`Error loading unit: ${error?.message ?? 'Unknown'}`)
		}
	}, [isError, error])

	// Memoize field rows unconditionally to satisfy Rules of Hooks
	const fieldRows = useMemo(() => {
		if (!unit) return []
		return [
			{ label: 'Unit number', value: unit.unitNumber },
			{
				label: 'Status',
				value: unit.status.replace(/_/g, ' '),
			},
			unit.description && {
				label: 'Description',
				value: unit.description,
				multiline: true,
			},
			{
				label: 'Rent',
				value: formatCurrency(unit.rentAmount),
			},
			unit.securityDeposit != null && {
				label: 'Security deposit',
				value: formatCurrency(unit.securityDeposit),
			},
			(unit.bedrooms != null || unit.bathrooms != null) && {
				label: 'Beds / Baths',
				value: `${unit.bedrooms ?? '—'} / ${unit.bathrooms ?? '—'}`,
			},
			unit.squareFootage != null && {
				label: 'Square footage',
				value: `${unit.squareFootage} sq ft`,
			},
			(unit.balcony != null ||
				unit.laundryInUnit != null ||
				unit.hardwoodFloors != null) && {
				label: 'Features',
				value:
					[
						unit.balcony && 'Balcony',
						unit.laundryInUnit && 'Laundry in unit',
						unit.hardwoodFloors && 'Hardwood floors',
					]
						.filter(Boolean)
						.join(' · ') || '—',
			},
		]
	}, [unit])

	const skeleton = (
		<div className="flex flex-col gap-6">
			<div className="flex items-center gap-2">
				<Skeleton className="h-9 w-9 rounded" />
				<Skeleton className="h-8 w-48" />
			</div>
			<div className="space-y-3">
				{[1, 2, 3, 4, 5, 6].map((i) => (
					<div key={i} className="flex gap-6">
						<Skeleton className="h-5 w-24 shrink-0" />
						<Skeleton className="h-5 flex-1" />
					</div>
				))}
			</div>
		</div>
	)

	const propName = prop?.legalName ?? 'Property'

	return (
		<DelayedLoadingFallback isLoading={isLoading} fallback={skeleton}>
			{isError || !unit || unit.propertyId !== propId ? (
				<CenteredEmptyState
					title="Unit not found"
					description={
						isError
							? (error?.message ?? 'Failed to load unit')
							: 'The unit you were looking for was not found.'
					}
					action={
						<TextLink to="/props/$id" params={{ id: propId }}>
							Back to {propName}
						</TextLink>
					}
				/>
			) : (
				<div className="flex flex-col gap-6">
					<BannerHeader
						title={`Unit ${unit.unitNumber}`}
						description={
							<>
								{unit.status.replace(/_/g, ' ')}
								{unit.rentAmount != null &&
									` · ${formatCurrency(unit.rentAmount)}`}
							</>
						}
						breadcrumbItems={[
							{ label: 'Properties', to: '/props' },
							{ label: propName, to: `/props/${propId}` },
						]}
						actions={
							<UnitActions
								unit={unit}
								propId={propId}
								onEdit={() => setEditingUnit(unit)}
							/>
						}
					/>

					<FieldsTable rows={fieldRows} />

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
				</div>
			)}
		</DelayedLoadingFallback>
	)
}
