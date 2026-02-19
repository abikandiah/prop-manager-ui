import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ChevronDown, ChevronRight } from 'lucide-react'
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
import { UnitStatus } from '@/domain/unit'
import { EntityActions, TableSkeleton } from '@/components/ui'
import { useDeleteUnit, useUnitsList } from '@/features/units'
import { usePropsList } from '@/features/props'
import { config } from '@/config'
import { formatCurrency, formatEnumLabel } from '@/lib/format'
import type { Prop } from '@/domain/property'

interface UnitGroup {
	propId: string
	prop: Prop | undefined
	units: Unit[]
}

const EXPANDED_STORAGE_KEY = 'units-grouped-expanded'

function readExpandedFromStorage(): Set<string> {
	try {
		const stored = sessionStorage.getItem(EXPANDED_STORAGE_KEY)
		if (stored) return new Set(JSON.parse(stored) as string[])
	} catch {
		// ignore
	}
	return new Set()
}

function writeExpandedToStorage(ids: Set<string>): void {
	try {
		sessionStorage.setItem(EXPANDED_STORAGE_KEY, JSON.stringify([...ids]))
	} catch {
		// ignore
	}
}

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

function PropertyGroupHeader({
	group,
	isExpanded,
	onToggle,
}: {
	group: UnitGroup
	isExpanded: boolean
	onToggle: () => void
}) {
	const { prop, units } = group
	const occupiedCount = units.filter(
		(u) => u.status === UnitStatus.OCCUPIED,
	).length
	const vacantCount = units.filter(
		(u) => u.status === UnitStatus.VACANT,
	).length
	const address = prop?.address
	const addressText = address
		? `${address.city}, ${address.stateProvinceRegion}`
		: null

	return (
		<TableRow
			className="bg-muted/40 hover:bg-muted/60 cursor-pointer select-none"
			onClick={onToggle}
		>
			<TableCell colSpan={7} className="py-2.5">
				<div className="flex items-center gap-2">
					{isExpanded ? (
						<ChevronDown className="size-4 shrink-0 text-muted-foreground" />
					) : (
						<ChevronRight className="size-4 shrink-0 text-muted-foreground" />
					)}
					<span className="font-semibold text-sm text-foreground">
						{prop?.legalName ?? group.propId}
					</span>
					{addressText && (
						<span className="text-xs text-muted-foreground">{addressText}</span>
					)}
					<div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
						<span>
							{units.length} {units.length === 1 ? 'unit' : 'units'}
						</span>
						<span>
							{occupiedCount} occupied
							{vacantCount > 0 && `, ${vacantCount} vacant`}
						</span>
					</div>
				</div>
			</TableCell>
		</TableRow>
	)
}

export function UnitsGroupedView() {
	const navigate = useNavigate()
	const {
		data: units,
		isLoading: unitsLoading,
		isError,
		error,
	} = useUnitsList()
	const { data: props, isLoading: propsLoading } = usePropsList()
	const isLoading = unitsLoading || propsLoading

	const [editingUnit, setEditingUnit] = useState<Unit | null>(null)
	const [expandedIds, setExpandedIds] = useState<Set<string>>(
		readExpandedFromStorage,
	)
	// Skip first-group default if the user already has stored preferences
	const hasInitializedRef = useRef(readExpandedFromStorage().size > 0)

	const groups = useMemo<UnitGroup[]>(() => {
		if (!units) return []
		const propMap = new Map((props ?? []).map((p) => [p.id, p]))
		const groupMap = new Map<string, Unit[]>()
		for (const unit of units) {
			const existing = groupMap.get(unit.propertyId)
			if (existing) {
				existing.push(unit)
			} else {
				groupMap.set(unit.propertyId, [unit])
			}
		}
		return Array.from(groupMap.entries())
			.map(([propId, propUnits]) => ({
				propId,
				prop: propMap.get(propId),
				units: propUnits.sort((a, b) =>
					a.unitNumber.localeCompare(b.unitNumber),
				),
			}))
			.sort((a, b) =>
				(a.prop?.legalName ?? a.propId).localeCompare(
					b.prop?.legalName ?? b.propId,
				),
			)
	}, [units, props])

	// Expand the first group once data loads (only if no stored preference)
	useEffect(() => {
		if (!hasInitializedRef.current && groups.length > 0) {
			hasInitializedRef.current = true
			const initial = new Set([groups[0].propId])
			setExpandedIds(initial)
			writeExpandedToStorage(initial)
		}
	}, [groups])

	const toggleGroup = (propId: string) => {
		setExpandedIds((prev) => {
			const next = new Set(prev)
			if (next.has(propId)) {
				next.delete(propId)
			} else {
				next.add(propId)
			}
			writeExpandedToStorage(next)
			return next
		})
	}

	const handleRowClick = (unit: Unit) => {
		navigate({ to: '/units/$unitId', params: { unitId: unit.id } })
	}

	// Show error toast once per error instance, not on every re-render
	const lastErrorRef = useRef<unknown>(null)
	if (isError && error !== lastErrorRef.current) {
		lastErrorRef.current = error
		toast.error(`Error loading units: ${error.message || 'Unknown'}`)
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
							{groups.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={7}
										className="h-24 text-center text-muted-foreground"
									>
										No units yet. Add one above.
									</TableCell>
								</TableRow>
							) : (
								groups.map((group) => {
									const isExpanded = expandedIds.has(group.propId)
									return (
										<Fragment key={group.propId}>
											<PropertyGroupHeader
												group={group}
												isExpanded={isExpanded}
												onToggle={() => toggleGroup(group.propId)}
											/>
											{isExpanded &&
												group.units.map((unit) => (
													<TableRow
														key={unit.id}
														className="cursor-pointer hover:bg-muted/50"
														onClick={() => handleRowClick(unit)}
													>
														<TableCell className="font-medium pl-10">
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
												))}
										</Fragment>
									)
								})
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
						className="max-w-[calc(100vw-2rem)] sm:max-w-2xl"
					>
						<UnitForm
							propId={editingUnit.propertyId}
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
