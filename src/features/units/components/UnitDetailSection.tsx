import { useEffect, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { MoreVertical, Pencil, Trash2, X } from 'lucide-react'
import { Button } from '@abumble/design-system/components/Button'
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from '@abumble/design-system/components/Breadcrumb'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@abumble/design-system/components/Popover'
import { Skeleton } from '@abumble/design-system/components/Skeleton'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	FormDialog,
} from '@/components/ui/dialog'
import { useUnitDetail, useDeleteUnit } from '@/features/units/hooks'
import type { Unit } from '@/features/units/units'
import { DelayedLoadingFallback } from '@/components/ui'
import { UnitForm } from './UnitForm'

function formatCurrency(n: number | null): string {
	if (n == null) return '—'
	return new Intl.NumberFormat(undefined, {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(n)
}

function UnitActions({
	unit,
	propId,
	onEdit,
	onDeleted,
}: {
	unit: Unit
	propId: string
	onEdit: () => void
	onDeleted?: () => void
}) {
	const navigate = useNavigate()
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
				if (onDeleted) onDeleted()
				else navigate({ to: '/props/$id', params: { id: propId }, search: {} })
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

export interface UnitDetailSectionProps {
	propId: string
	unitId: string
	/** When true, "Units" breadcrumb and delete close the modal via onClose instead of navigating. */
	inModal?: boolean
	onClose?: () => void
}

export function UnitDetailSection({
	propId,
	unitId,
	inModal = false,
	onClose,
}: UnitDetailSectionProps) {
	const navigate = useNavigate()
	const { data: unit, isLoading, isError, error } = useUnitDetail(unitId)
	const [editingUnit, setEditingUnit] = useState<Unit | null>(null)
	const handleBackOrClose = inModal && onClose ? onClose : undefined

	useEffect(() => {
		if (isError) {
			toast.error(`Error loading unit: ${error?.message ?? 'Unknown'}`)
		}
	}, [isError, error])

	const skeleton = (
		<section className="space-y-4 mt-22">
			<div className="flex items-center gap-2">
				<Skeleton className="h-8 w-32" />
				<Skeleton className="h-8 w-24" />
			</div>
			<div className="space-y-3">
				{[1, 2, 3, 4, 5, 6].map((i) => (
					<div key={i} className="flex gap-6">
						<Skeleton className="h-5 w-24 shrink-0" />
						<Skeleton className="h-5 flex-1" />
					</div>
				))}
			</div>
		</section>
	)

	return (
		<DelayedLoadingFallback isLoading={isLoading} fallback={skeleton}>
			{isError || !unit || unit.propertyId !== propId ? (
				inModal && handleBackOrClose ? (
					<div className="flex flex-col">
						<header className="flex items-center justify-between border-b border-border bg-muted px-4 py-3 rounded-t-[var(--radius)]">
							<h2 className="text-lg font-semibold text-foreground tracking-tight">Unit</h2>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								className="size-8 shrink-0"
								onClick={handleBackOrClose}
								aria-label="Close"
							>
								<X className="size-4" />
							</Button>
						</header>
						<div className="p-4">
							<p className="text-muted-foreground text-sm">
								{isError
									? (error?.message ?? 'Failed to load unit')
									: 'Unit not found.'}
							</p>
						</div>
					</div>
				) : (
					<section className="space-y-4 mt-22">
						<p className="text-muted-foreground">
							{isError
								? (error?.message ?? 'Failed to load unit')
								: 'Unit not found.'}
						</p>
					</section>
				)
			) : inModal && handleBackOrClose ? (
				<div className="flex flex-col">
					<header className="flex items-center justify-between border-b border-border bg-muted px-4 py-3 rounded-t-[var(--radius)]">
						<h2 className="text-lg font-semibold text-foreground tracking-tight">
							Unit {unit.unitNumber}
						</h2>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							className="size-8 shrink-0"
							onClick={handleBackOrClose}
							aria-label="Close"
						>
							<X className="size-4" />
						</Button>
					</header>
					<div className="flex items-start gap-4 p-4">
						<table className="min-w-0 flex-1 border-0 text-left text-sm">
				<tbody>
					<tr>
						<th
							scope="row"
							className="py-1 pr-3 font-medium text-muted-foreground w-[9rem]"
						>
							Unit number
						</th>
						<td className="py-1 text-foreground">{unit.unitNumber}</td>
					</tr>
					<tr>
						<th
							scope="row"
							className="py-1 pr-3 font-medium text-muted-foreground"
						>
							Status
						</th>
						<td className="py-1 text-foreground">
							{unit.status.replace(/_/g, ' ')}
						</td>
					</tr>
					<tr>
						<th
							scope="row"
							className="py-1 pr-3 font-medium text-muted-foreground"
						>
							Rent
						</th>
						<td className="py-1 text-foreground">
							{formatCurrency(unit.rentAmount)}
						</td>
					</tr>
					{unit.securityDeposit != null && (
						<tr>
							<th
								scope="row"
								className="py-1 pr-3 font-medium text-muted-foreground"
							>
								Security deposit
							</th>
							<td className="py-1 text-foreground">
								{formatCurrency(unit.securityDeposit)}
							</td>
						</tr>
					)}
					{(unit.bedrooms != null || unit.bathrooms != null) && (
						<tr>
							<th
								scope="row"
								className="py-1 pr-3 font-medium text-muted-foreground"
							>
								Beds / Baths
							</th>
							<td className="py-1 text-foreground">
								{unit.bedrooms ?? '—'} / {unit.bathrooms ?? '—'}
							</td>
						</tr>
					)}
					{unit.squareFootage != null && (
						<tr>
							<th
								scope="row"
								className="py-1 pr-3 font-medium text-muted-foreground"
							>
								Square footage
							</th>
							<td className="py-1 text-foreground">
								{unit.squareFootage} sq ft
							</td>
						</tr>
					)}
					{(unit.balcony != null || unit.laundryInUnit != null || unit.hardwoodFloors != null) && (
						<tr>
							<th
								scope="row"
								className="py-1 pr-3 font-medium text-muted-foreground"
							>
								Features
							</th>
							<td className="py-1 text-foreground">
								{[unit.balcony && 'Balcony', unit.laundryInUnit && 'Laundry in unit', unit.hardwoodFloors && 'Hardwood floors']
									.filter(Boolean)
									.join(' · ') || '—'}
							</td>
						</tr>
					)}
				</tbody>
			</table>
						<div className="shrink-0">
							<UnitActions
								unit={unit}
								propId={propId}
								onEdit={() => setEditingUnit(unit)}
								onDeleted={handleBackOrClose}
							/>
						</div>
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
				</div>
			) : (
		<section className="space-y-4 mt-22">
			<div className="flex items-center justify-between gap-4">
				<Breadcrumb>
					<BreadcrumbList className="tracking-tight text-xl">
						<BreadcrumbItem>
							<BreadcrumbLink asChild>
								<Link
									to="/props/$id"
									params={{ id: propId }}
									className="font-normal text-muted-foreground hover:text-foreground hover:underline"
								>
									Units
								</Link>
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage className="text-foreground">
								{unit.unitNumber}
							</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>
				<UnitActions
					unit={unit}
					propId={propId}
					onEdit={() => setEditingUnit(unit)}
					onDeleted={() => navigate({ to: '/props/$id', params: { id: propId }, search: {} })}
				/>
			</div>

			<table className="w-full border-0 text-left text-sm">
				<tbody>
					<tr>
						<th
							scope="row"
							className="py-1 pr-3 font-medium text-muted-foreground w-[9rem]"
						>
							Unit number
						</th>
						<td className="py-1 text-foreground">{unit.unitNumber}</td>
					</tr>
					<tr>
						<th
							scope="row"
							className="py-1 pr-3 font-medium text-muted-foreground"
						>
							Status
						</th>
						<td className="py-1 text-foreground">
							{unit.status.replace(/_/g, ' ')}
						</td>
					</tr>
					<tr>
						<th
							scope="row"
							className="py-1 pr-3 font-medium text-muted-foreground"
						>
							Rent
						</th>
						<td className="py-1 text-foreground">
							{formatCurrency(unit.rentAmount)}
						</td>
					</tr>
					{unit.securityDeposit != null && (
						<tr>
							<th
								scope="row"
								className="py-1 pr-3 font-medium text-muted-foreground"
							>
								Security deposit
							</th>
							<td className="py-1 text-foreground">
								{formatCurrency(unit.securityDeposit)}
							</td>
						</tr>
					)}
					{(unit.bedrooms != null || unit.bathrooms != null) && (
						<tr>
							<th
								scope="row"
								className="py-1 pr-3 font-medium text-muted-foreground"
							>
								Beds / Baths
							</th>
							<td className="py-1 text-foreground">
								{unit.bedrooms ?? '—'} / {unit.bathrooms ?? '—'}
							</td>
						</tr>
					)}
					{unit.squareFootage != null && (
						<tr>
							<th
								scope="row"
								className="py-1 pr-3 font-medium text-muted-foreground"
							>
								Square footage
							</th>
							<td className="py-1 text-foreground">
								{unit.squareFootage} sq ft
							</td>
						</tr>
					)}
					{(unit.balcony != null || unit.laundryInUnit != null || unit.hardwoodFloors != null) && (
						<tr>
							<th
								scope="row"
								className="py-1 pr-3 font-medium text-muted-foreground"
							>
								Features
							</th>
							<td className="py-1 text-foreground">
								{[unit.balcony && 'Balcony', unit.laundryInUnit && 'Laundry in unit', unit.hardwoodFloors && 'Hardwood floors']
									.filter(Boolean)
									.join(' · ') || '—'}
							</td>
						</tr>
					)}
				</tbody>
			</table>

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
		</section>
			)
		}
		</DelayedLoadingFallback>
	)
}
