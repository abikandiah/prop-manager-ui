import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@abumble/design-system/components/Button'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@abumble/design-system/components/Popover'
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
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	FormDialog,
} from '@/components/ui/dialog'
import { useUnitsByPropId, useDeleteUnit } from '@/features/units/hooks'
import type { Unit } from '@/features/units/units'
import { DelayedLoadingFallback } from '@/components/ui'
import { UnitForm } from './UnitForm.tsx'

function formatCurrency(n: number | null): string {
	if (n == null) return '—'
	return new Intl.NumberFormat(undefined, {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(n)
}

function UnitRowActions({ unit, onEdit }: { unit: Unit; onEdit: () => void }) {
	const [open, setOpen] = useState(false)
	const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
	const deleteUnit = useDeleteUnit()

	const openDeleteConfirm = () => {
		setOpen(false)
		setDeleteConfirmOpen(true)
	}

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
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className="size-8 shrink-0"
						aria-label="Unit actions"
						onClick={(e) => e.stopPropagation()}
					>
						<MoreVertical className="size-4" />
					</Button>
				</PopoverTrigger>
				<PopoverContent align="end" className="w-40 p-0 mt-1">
					<ul className="flex flex-col gap-0.5 p-1.5">
						<li>
							<Button
								variant="ghost"
								size="sm"
								className="w-full justify-start gap-2"
								onClick={() => {
									setOpen(false)
									onEdit()
								}}
							>
								<Pencil className="size-4 shrink-0" />
								Edit
							</Button>
						</li>
						<li>
							<Button
								variant="ghost"
								size="sm"
								className="w-full justify-start gap-2 text-destructive hover:text-destructive"
								onClick={openDeleteConfirm}
								disabled={deleteUnit.isPending}
							>
								<Trash2 className="size-4 shrink-0" />
								Delete
							</Button>
						</li>
					</ul>
				</PopoverContent>
			</Popover>

			<Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
				<DialogContent showCloseButton={true}>
					<DialogHeader>
						<DialogTitle>Delete unit?</DialogTitle>
						<DialogDescription>
							Unit {unit.unitNumber} will be removed. This can&apos;t be undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter showCloseButton={false}>
						<Button
							variant="outline"
							onClick={() => setDeleteConfirmOpen(false)}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={handleDeleteConfirm}
							disabled={deleteUnit.isPending}
						>
							{deleteUnit.isPending ? 'Deleting…' : 'Delete'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
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
			to: '/props/$id',
			params: { id: propId },
			search: { unit: unitId },
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
