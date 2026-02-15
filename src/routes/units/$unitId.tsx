import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Skeleton } from '@abumble/design-system/components/Skeleton'
import { Pencil, Trash2 } from 'lucide-react'
import { usePropDetail } from '@/features/props'
import { useUnitDetail, useDeleteUnit, UnitForm } from '@/features/units'
import type { Unit } from '@/domain/unit'
import { formatCurrency } from '@/lib/format'
import {
	ActionsPopover,
	BannerHeader,
	ConfirmDeleteDialog,
	DelayedLoadingFallback,
	FormDialog,
	TextLink,
} from '@/components/ui'
import { config } from '@/config'
import { CenteredEmptyState } from '@/components/CenteredEmptyState'

export const Route = createFileRoute('/units/$unitId')({
	component: UnitDetailPage,
})

function UnitActions({
	unit,
	onEdit,
}: {
	unit: Unit
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
					navigate({ to: '/units' })
				},
				onError: (err) => {
					toast.error(err.message || 'Failed to delete unit')
				},
			},
		)
	}

	return (
		<>
			<ActionsPopover
				label="Unit actions"
				items={[
					{
						label: 'Edit',
						icon: <Pencil className="size-4" />,
						onClick: onEdit,
					},
					{
						label: 'Delete',
						icon: <Trash2 className="size-4" />,
						onClick: () => setDeleteConfirmOpen(true),
						variant: 'destructive',
						disabled: deleteUnit.isPending,
					},
				]}
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
	const { unitId } = Route.useParams()

	const {
		data: unit,
		isLoading: unitLoading,
		isError,
		error,
	} = useUnitDetail(unitId)
	
	const { data: prop, isLoading: propLoading } = usePropDetail(unit?.propertyId ?? null)
	
	const [editingUnit, setEditingUnit] = useState<Unit | null>(null)

	const isLoading = unitLoading || propLoading

	useEffect(() => {
		if (isError) {
			toast.error(`Error loading unit: ${error?.message || 'Unknown'}`)
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
			{isError || !unit ? (
				<CenteredEmptyState
					title="Unit not found"
					description={
						isError
							? (error?.message || 'Failed to load unit')
							: 'The unit you were looking for was not found.'
					}
					action={
						<TextLink to="/units">
							Back to units
						</TextLink>
					}
				/>
			) : (
				<div className="flex flex-col gap-6">
					<BannerHeader
						linkComponent={Link}
						backLink={{ label: 'Back to units' }}
						title={`Unit ${unit.unitNumber}`}
						description={
							<>
								{unit.status.replace(/_/g, ' ')}
								{unit.rentAmount != null &&
									` · ${formatCurrency(unit.rentAmount)}`}
								{prop && ` · ${prop.legalName}`}
							</>
						}
						actions={
							<UnitActions
								unit={unit}
								onEdit={() => setEditingUnit(unit)}
							/>
						}
					/>

					<div className="grid gap-x-8 gap-y-6 md:grid-cols-2 lg:grid-cols-3">
						{/* Group: Primary Info */}
						<div className="space-y-6">
							<div>
								<label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
									Unit Number
								</label>
								<p className="mt-1 text-lg font-semibold text-foreground">
									{unit.unitNumber}
								</p>
							</div>
							<div>
								<label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
									Status
								</label>
								<p className="mt-1 text-foreground">
									{unit.status.replace(/_/g, ' ')}
								</p>
							</div>
							<div>
								<label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
									Property
								</label>
								<p className="mt-1 text-foreground font-medium">
									{prop?.legalName ?? '—'}
								</p>
							</div>
						</div>

						{/* Group: Financials */}
						<div className="space-y-6">
							<div>
								<label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
									Rent
								</label>
								<p className="mt-1 text-foreground">
									{formatCurrency(unit.rentAmount)}
								</p>
							</div>
							<div>
								<label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
									Security Deposit
								</label>
								<p className="mt-1 text-foreground">
									{unit.securityDeposit != null
										? formatCurrency(unit.securityDeposit)
										: '—'}
								</p>
							</div>
						</div>

						{/* Group: Specs */}
						<div className="space-y-6">
							<div>
								<label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
									Beds / Baths
								</label>
								<p className="mt-1 text-foreground">
									{unit.bedrooms ?? '—'} / {unit.bathrooms ?? '—'}
								</p>
							</div>
							<div>
								<label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
									Square Footage
								</label>
								<p className="mt-1 text-foreground">
									{unit.squareFootage != null
										? `${unit.squareFootage.toLocaleString()} sq ft`
										: '—'}
								</p>
							</div>
						</div>

						{/* Group: Features (Full width on small, grid-col span on large) */}
						<div className="md:col-span-2 lg:col-span-3 pt-4 border-t">
							<label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
								Features
							</label>
							<div className="mt-2 flex flex-wrap gap-2">
								{[
									unit.balcony && 'Balcony',
									unit.laundryInUnit && 'Laundry in unit',
									unit.hardwoodFloors && 'Hardwood floors',
								]
									.filter(Boolean)
									.map((feature) => (
										<span
											key={feature as string}
											className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
										>
											{feature}
										</span>
									))}
								{!unit.balcony &&
									!unit.laundryInUnit &&
									!unit.hardwoodFloors && (
										<p className="text-muted-foreground">No features listed</p>
									)}
							</div>
						</div>

						{/* Group: Description (Full Width) */}
						{unit.description && (
							<div className="md:col-span-2 lg:col-span-3 pt-4 border-t">
								<label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
									Description
								</label>
								<p className="mt-2 text-foreground whitespace-pre-wrap leading-relaxed">
									{unit.description}
								</p>
							</div>
						)}
					</div>

					{editingUnit && (
						<FormDialog
							open={!!editingUnit}
							onOpenChange={() => setEditingUnit(null)}
							title="Edit unit"
							description={`Update unit ${editingUnit.unitNumber} details.`}
						>
							<UnitForm
								propId={unit.propertyId}
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
