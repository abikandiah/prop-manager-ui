import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Skeleton } from '@abumble/design-system/components/Skeleton'
import { Pencil, Trash2 } from 'lucide-react'
import type { Prop } from '@/domain/property'
import { AddressDisplay, PropsForm, useDeleteProp, usePropDetail } from '@/features/props'
import { formatAddress } from '@/lib/format'
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
				toast.error(err.message || 'Failed to delete property')
			},
		})
	}

	return (
		<>
			<ActionsPopover
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
						disabled: deleteProp.isPending,
					},
				]}
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
			toast.error(`Error loading property: ${error?.message || 'Unknown'}`)
		}
	}, [isError, error])

	const skeleton = (
		<div className="flex flex-col gap-6">
			<div className="flex items-center gap-2">
				<Skeleton className="h-9 w-9 rounded" />
				<Skeleton className="h-8 w-48" />
			</div>
			<div className="grid gap-x-8 gap-y-6 md:grid-cols-2">
				<div className="space-y-6">
					{[1, 2].map((i) => (
						<div key={i} className="space-y-2">
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-6 w-48" />
						</div>
					))}
				</div>
				<div className="grid grid-cols-2 gap-6">
					{[1, 2, 3].map((i) => (
						<div key={i} className={i === 3 ? 'col-span-2 space-y-2' : 'space-y-2'}>
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-6 w-full" />
						</div>
					))}
				</div>
				<div className="md:col-span-2 pt-4 border-t space-y-2">
					<Skeleton className="h-4 w-24" />
					<Skeleton className="h-6 w-full" />
				</div>
			</div>
		</div>
	)

	return (
		<DelayedLoadingFallback
			isLoading={isLoading}
			delayMs={config.loadingFallbackDelayMs}
			fallback={skeleton}
		>
			{isError || !prop ? (
				<CenteredEmptyState
					title="Property not found"
					description={
						isError
							? (error?.message || 'Failed to load property')
							: 'The property you were looking for was not found.'
					}
					action={<TextLink to="/props">Back to properties</TextLink>}
				/>
			) : (
				<div className="flex flex-col gap-6">
					<BannerHeader
						linkComponent={Link}
						backLink={{ label: 'Back to properties' }}
						title={prop.legalName}
						description={
							<>
								{prop.propertyType.replace(/_/g, ' ')}
								{prop.address && ` · ${formatAddress(prop.address)}`}
							</>
						}
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

					<div className="grid gap-x-8 gap-y-6 md:grid-cols-2">
						{/* Group: Primary Info */}
						<div className="space-y-6">
							<div>
								<label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
									Legal Name
								</label>
								<p className="mt-1 text-lg font-semibold text-foreground">
									{prop.legalName}
								</p>
							</div>
							<div>
								<label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
									Property Type
								</label>
								<p className="mt-1 text-foreground">
									{prop.propertyType.replace(/_/g, ' ')}
								</p>
							</div>
						</div>

						{/* Group: Details */}
						<div className="grid grid-cols-2 gap-6">
							<div>
								<label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
									Total Area
								</label>
								<p className="mt-1 text-foreground">
									{prop.totalArea != null
										? `${prop.totalArea.toLocaleString()} sq ft`
										: '—'}
								</p>
							</div>
							<div>
								<label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
									Year Built
								</label>
								<p className="mt-1 text-foreground">{prop.yearBuilt ?? '—'}</p>
							</div>
							<div className="col-span-2">
								<label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
									Parcel Number
								</label>
								<p className="mt-1 text-foreground font-mono">
									{prop.parcelNumber ?? '—'}
								</p>
							</div>
						</div>

						{/* Group: Location (Full Width) */}
						<div className="md:col-span-2 pt-4 border-t">
							<label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
								Location
							</label>
							<div className="mt-2">
								<AddressDisplay address={prop.address} className="text-foreground" />
							</div>
						</div>

						{/* Group: Description (Full Width) */}
						{prop.description && (
							<div className="md:col-span-2 pt-4 border-t">
								<label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
									Description
								</label>
								<p className="mt-2 text-foreground whitespace-pre-wrap leading-relaxed">
									{prop.description}
								</p>
							</div>
						)}
					</div>
				</div>
			)}
		</DelayedLoadingFallback>
	)
}
