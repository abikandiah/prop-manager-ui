import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState, useMemo } from 'react'
import { toast } from 'sonner'
import { Skeleton } from '@abumble/design-system/components/Skeleton'
import { Button } from '@abumble/design-system/components/Button'
import { Plus } from 'lucide-react'
import { AddressDisplay, PropsForm } from '@/features/props/components'
import { usePropDetail, useDeleteProp } from '@/features/props/hooks'
import { formatAddress } from '@/features/props/props'
import type { Prop } from '@/features/props/props'
import { UnitForm, UnitsTableView } from '@/features/units/components'
import {
	ActionsPopover,
	BannerHeader,
	ConfirmDeleteDialog,
	DelayedLoadingFallback,
	FieldsTable,
	FormDialog,
	DialogTrigger,
	TextLink,
} from '@/components/ui'
import { CenteredEmptyState } from '@/components/CenteredEmptyState'

export const Route = createFileRoute('/props/$id/')({
	component: PropLayout,
})

function PropActions({ prop, onEdit }: { prop: Prop; onEdit: () => void }) {
	const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
	const navigate = useNavigate()
	const deleteProp = useDeleteProp()

	const handleDeleteConfirm = () => {
		deleteProp.mutate(prop.id, {
			onSuccess: () => {
				setDeleteConfirmOpen(false)
				toast.success('Property deleted')
				navigate({ to: '/props' })
			},
			onError: (err) => {
				toast.error(err?.message ?? 'Failed to delete property')
			},
		})
	}

	return (
		<>
			<ActionsPopover
				onEdit={onEdit}
				onDelete={() => setDeleteConfirmOpen(true)}
				isDeleteDisabled={deleteProp.isPending}
			/>
			<ConfirmDeleteDialog
				open={deleteConfirmOpen}
				onOpenChange={setDeleteConfirmOpen}
				title="Delete property?"
				description={
					<>{prop.legalName} will be removed. This can&apos;t be undone.</>
				}
				onConfirm={handleDeleteConfirm}
				isPending={deleteProp.isPending}
			/>
		</>
	)
}

function PropLayout() {
	const { id } = Route.useParams()

	const { data: prop, isLoading, isError, error } = usePropDetail(id)
	const [editingProp, setEditingProp] = useState<Prop | null>(null)

	useEffect(() => {
		if (isError) {
			toast.error(`Error loading property: ${error?.message ?? 'Unknown'}`)
		}
	}, [isError, error])

	// Memoize field rows unconditionally to satisfy Rules of Hooks
	const fieldRows = useMemo(() => {
		if (!prop) return []
		return [
			{ label: 'Legal name', value: prop.legalName },
			{
				label: 'Property type',
				value: prop.propertyType.replace(/_/g, ' '),
			},
			prop.description && {
				label: 'Description',
				value: prop.description,
				multiline: true,
			},
			prop.parcelNumber && {
				label: 'Parcel number',
				value: prop.parcelNumber,
			},
			prop.totalArea != null && {
				label: 'Total area',
				value: `${prop.totalArea} sq ft`,
			},
			prop.yearBuilt != null && {
				label: 'Year built',
				value: prop.yearBuilt,
			},
			prop.address && {
				label: 'Address',
				value: <AddressDisplay address={prop.address} />,
			},
		]
	}, [prop])

	const skeleton = (
		<div className="flex flex-col gap-6">
			<div className="flex items-center gap-2">
				<Skeleton className="h-9 w-9 rounded" />
				<Skeleton className="h-8 w-48" />
			</div>
			<div className="space-y-3">
				{[1, 2, 3, 4, 5].map((i) => (
					<div key={i} className="flex gap-6">
						<Skeleton className="h-5 w-24 shrink-0" />
						<Skeleton className="h-5 flex-1" />
					</div>
				))}
			</div>
		</div>
	)

	return (
		<DelayedLoadingFallback isLoading={isLoading} fallback={skeleton}>
			{isError || !prop ? (
				<CenteredEmptyState
					title="Property not found"
					description={
						isError
							? (error?.message ?? 'Failed to load property')
							: 'The property you were looking for was not found.'
					}
					action={<TextLink to="/props">Back to properties</TextLink>}
				/>
			) : (
				<div className="flex flex-col gap-6">
					<BannerHeader
						title={prop.legalName}
						description={
							<>
								{prop.propertyType.replace(/_/g, ' ')}
								{prop.address && ` · ${formatAddress(prop.address)}`}
							</>
						}
						breadcrumbItems={[{ label: 'Properties', to: '/props' }]}
						actions={
							<PropActions prop={prop} onEdit={() => setEditingProp(prop)} />
						}
					/>

					{editingProp && (
						<FormDialog
							open={!!editingProp}
							onOpenChange={() => setEditingProp(null)}
							title="Edit property"
							description={`Update ${editingProp.legalName} details.`}
						>
							<PropsForm
								initialProp={editingProp}
								onSuccess={() => setEditingProp(null)}
								onCancel={() => setEditingProp(null)}
								submitLabel="Update Property"
							/>
						</FormDialog>
					)}

					<FieldsTable rows={fieldRows} />

					<UnitsSection propId={prop.id} />
				</div>
			)}
		</DelayedLoadingFallback>
	)
}

function UnitsSection({ propId }: { propId: string }) {
	const [addUnitOpen, setAddUnitOpen] = useState(false)
	return (
		<section className="space-y-4 mt-2">
			<div className="space-y-1.5">
				<h2 className="tracking-tight text-foreground sm:text-2xl text-xl">
					Units
				</h2>
				<p className="text-muted-foreground">
					Units within this property—apartments, suites, or rentable spaces. Add
					each with a unit number and details; you can attach tenants and leases
					later.
				</p>
			</div>
			<div>
				<FormDialog
					open={addUnitOpen}
					onOpenChange={setAddUnitOpen}
					title="Add unit"
					description="Add a unit to this property. Unit number and status are required."
					trigger={
						<DialogTrigger asChild>
							<Button>
								<Plus className="size-4" />
								Add unit
							</Button>
						</DialogTrigger>
					}
				>
					<UnitForm
						propId={propId}
						onSuccess={() => setAddUnitOpen(false)}
						onCancel={() => setAddUnitOpen(false)}
						submitLabel="Create Unit"
					/>
				</FormDialog>
			</div>
			<UnitsTableView propId={propId} />
		</section>
	)
}
