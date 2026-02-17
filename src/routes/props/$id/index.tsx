import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Skeleton } from '@abumble/design-system/components/Skeleton'
import { BannerHeader } from '@abumble/design-system/components/BannerHeader'
import { DelayedLoadingFallback } from '@abumble/design-system/components/DelayedLoadingFallback'
import { FormDialog } from '@abumble/design-system/components/Dialog'
import type { Prop } from '@/domain/property'
import {
	AddressDisplay,
	PropsForm,
	useDeleteProp,
	usePropDetail,
} from '@/features/props'
import { formatAddress, formatEnumLabel } from '@/lib/format'
import {
	DetailField,
	DETAIL_LABEL_CLASS,
	EntityActions,
	TextLink,
} from '@/components/ui'
import { config } from '@/config'
import { CenteredEmptyState } from '@/components/CenteredEmptyState'

export const Route = createFileRoute('/props/$id/')({
	component: PropLayout,
})

function PropActions({ prop, onEdit }: { prop: Prop; onEdit: () => void }) {
	const navigate = useNavigate()
	const deleteProp = useDeleteProp()

	return (
		<EntityActions
			label="Property actions"
			onEdit={onEdit}
			onDelete={() => {
				deleteProp.mutate(prop.id, {
					onSuccess: () => {
						toast.success('Property deleted')
						navigate({ to: '/props' })
					},
					onError: (err) => {
						toast.error(err.message || 'Failed to delete property')
					},
				})
			}}
			isDeletePending={deleteProp.isPending}
			deleteTitle="Delete property?"
			deleteDescription={
				<>{prop.legalName} will be removed. This can&apos;t be undone.</>
			}
		/>
	)
}

function PropLayout() {
	const { id } = Route.useParams()

	const { data: prop, isLoading, isError, error } = usePropDetail(id)
	const [editingProp, setEditingProp] = useState<Prop | null>(null)

	useEffect(() => {
		if (isError) {
			toast.error(`Error loading property: ${error.message || 'Unknown'}`)
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
						<div
							key={i}
							className={i === 3 ? 'col-span-2 space-y-2' : 'space-y-2'}
						>
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
							? error.message || 'Failed to load property'
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
								{formatEnumLabel(prop.propertyType)}
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
							<DetailField
								label="Legal Name"
								valueClassName="text-lg font-semibold text-foreground"
							>
								{prop.legalName}
							</DetailField>
							<DetailField label="Property Type">
								{formatEnumLabel(prop.propertyType)}
							</DetailField>
						</div>

						{/* Group: Details */}
						<div className="grid grid-cols-2 gap-6">
							<DetailField label="Total Area">
								{prop.totalArea != null
									? `${prop.totalArea.toLocaleString()} sq ft`
									: '—'}
							</DetailField>
							<DetailField label="Year Built">
								{prop.yearBuilt ?? '—'}
							</DetailField>
							<div className="col-span-2">
								<DetailField
									label="Parcel Number"
									valueClassName="text-foreground font-mono"
								>
									{prop.parcelNumber ?? '—'}
								</DetailField>
							</div>
						</div>

						{/* Group: Location (Full Width) */}
						<div className="md:col-span-2 border-t pt-4">
							<label className={DETAIL_LABEL_CLASS}>Location</label>
							<div className="mt-2">
								<AddressDisplay
									address={prop.address}
									className="text-foreground"
								/>
							</div>
						</div>

						{/* Group: Description (Full Width) */}
						{prop.description && (
							<div className="md:col-span-2 border-t pt-4">
								<DetailField
									label="Description"
									valueClassName="text-foreground whitespace-pre-wrap leading-relaxed"
								>
									{prop.description}
								</DetailField>
							</div>
						)}
					</div>
				</div>
			)}
		</DelayedLoadingFallback>
	)
}
