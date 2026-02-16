import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Skeleton } from '@abumble/design-system/components/Skeleton'
import { BannerHeader } from '@abumble/design-system/components/BannerHeader'
import { DelayedLoadingFallback } from '@abumble/design-system/components/DelayedLoadingFallback'
import { FormDialog } from '@abumble/design-system/components/Dialog'
import type { Unit } from '@/domain/unit'
import { usePropDetail } from '@/features/props'
import { UnitForm, useDeleteUnit, useUnitDetail } from '@/features/units'
import { formatCurrency } from '@/lib/format'
import {
	DetailField,
	DETAIL_LABEL_CLASS,
	EntityActions,
	TextLink,
} from '@/components/ui'
import { config } from '@/config'
import { CenteredEmptyState } from '@/components/CenteredEmptyState'

export const Route = createFileRoute('/units/$unitId')({
	component: UnitDetailPage,
})

function UnitActions({ unit, onEdit }: { unit: Unit; onEdit: () => void }) {
	const navigate = useNavigate()
	const deleteUnit = useDeleteUnit()

	return (
		<EntityActions
			label="Unit actions"
			onEdit={onEdit}
			onDelete={() => {
				deleteUnit.mutate(
					{ id: unit.id, propertyId: unit.propertyId },
					{
						onSuccess: () => {
							toast.success('Unit deleted')
							navigate({ to: '/units' })
						},
						onError: (err) => {
							toast.error(err.message || 'Failed to delete unit')
						},
					},
				)
			}}
			isDeletePending={deleteUnit.isPending}
			deleteTitle="Delete unit?"
			deleteDescription={
				<>Unit {unit.unitNumber} will be removed. This can&apos;t be undone.</>
			}
		/>
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

	const { data: prop, isLoading: propLoading } = usePropDetail(
		unit?.propertyId ?? null,
	)

	const [editingUnit, setEditingUnit] = useState<Unit | null>(null)

	const isLoading = unitLoading || propLoading

	useEffect(() => {
		if (isError) {
			toast.error(`Error loading unit: ${error.message || 'Unknown'}`)
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
							? error.message || 'Failed to load unit'
							: 'The unit you were looking for was not found.'
					}
					action={<TextLink to="/units">Back to units</TextLink>}
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
							<UnitActions unit={unit} onEdit={() => setEditingUnit(unit)} />
						}
					/>

					<div className="grid gap-x-8 gap-y-6 md:grid-cols-2 lg:grid-cols-3">
						{/* Group: Primary Info */}
						<div className="space-y-6">
							<DetailField
								label="Unit Number"
								valueClassName="text-lg font-semibold text-foreground"
							>
								{unit.unitNumber}
							</DetailField>
							<DetailField label="Status">
								{unit.status.replace(/_/g, ' ')}
							</DetailField>
							<DetailField
								label="Property"
								valueClassName="text-foreground font-medium"
							>
								{prop?.legalName ?? '—'}
							</DetailField>
						</div>

						{/* Group: Financials */}
						<div className="space-y-6">
							<DetailField label="Rent">
								{formatCurrency(unit.rentAmount)}
							</DetailField>
							<DetailField label="Security Deposit">
								{unit.securityDeposit != null
									? formatCurrency(unit.securityDeposit)
									: '—'}
							</DetailField>
						</div>

						{/* Group: Specs */}
						<div className="space-y-6">
							<DetailField label="Beds / Baths">
								{unit.bedrooms ?? '—'} / {unit.bathrooms ?? '—'}
							</DetailField>
							<DetailField label="Square Footage">
								{unit.squareFootage != null
									? `${unit.squareFootage.toLocaleString()} sq ft`
									: '—'}
							</DetailField>
						</div>

						{/* Group: Features (Full width on small, grid-col span on large) */}
						<div className="md:col-span-2 lg:col-span-3 border-t pt-4">
							<label className={DETAIL_LABEL_CLASS}>Features</label>
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
							<div className="md:col-span-2 lg:col-span-3 border-t pt-4">
								<DetailField
									label="Description"
									valueClassName="text-foreground whitespace-pre-wrap leading-relaxed"
								>
									{unit.description}
								</DetailField>
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
