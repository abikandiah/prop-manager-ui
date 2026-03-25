import { CenteredEmptyState } from '@/components/CenteredEmptyState'
import {
	DetailField,
	EntityActions,
	SectionCard,
	TextLink,
} from '@/components/ui'
import { config } from '@/config'
import type { Prop } from '@/domain/property'
import { ResourceType } from '@/domain/policy-assignment'
import {
	AddressDisplay,
	PropsForm,
	useDeleteProp,
	usePropDetail,
} from '@/features/props'
import { formatAddress, formatDate, formatEnumLabel } from '@/lib/format'
import { FORM_DIALOG_CLASS, useEditDialogState } from '@/lib/dialog'
import { useCan } from '@/lib/permissions'
import { BannerHeader } from '@abumble/design-system/components/BannerHeader'
import { DelayedLoadingFallback } from '@abumble/design-system/components/DelayedLoadingFallback'
import { FormDialog } from '@abumble/design-system/components/Dialog'
import { Skeleton } from '@abumble/design-system/components/Skeleton'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { toast } from 'sonner'

export const Route = createFileRoute(
	'/_auth/_org/_dashboard/_manager/props/$id/',
)({
	component: PropLayout,
})

function PropActions({ prop, onEdit }: { prop: Prop; onEdit: () => void }) {
	const navigate = useNavigate()
	const deleteProp = useDeleteProp()
	const canUpdate = useCan('UPDATE', 'PORTFOLIO', ResourceType.PROPERTY, prop.id)
	const canDelete = useCan('DELETE', 'PORTFOLIO', ResourceType.PROPERTY, prop.id)

	return (
		<EntityActions
			label="Property actions"
			onEdit={canUpdate ? onEdit : undefined}
			onDelete={() => {
				deleteProp.mutate(prop.id, {
					onSuccess: () => {
						toast.success('Property deleted')
						navigate({ to: '/props' })
					},
				})
			}}
			disableDelete={!canDelete}
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
	const editDialog = useEditDialogState<Prop>()

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
			<div className="grid gap-4 lg:grid-cols-[1fr_260px]">
				<div className="flex flex-col gap-4">
					{[3, 2].map((count, si) => (
						<SectionCard key={si}>
							<div className="grid gap-4 sm:grid-cols-2">
								{Array.from({ length: count }).map((_, i) => (
									<div key={i} className="space-y-2">
										<Skeleton className="h-3 w-20" />
										<Skeleton className="h-5 w-full" />
									</div>
								))}
							</div>
						</SectionCard>
					))}
				</div>
				<SectionCard>
					<div className="flex flex-col gap-4">
						{[1, 2, 3].map((i) => (
							<div key={i} className="space-y-2">
								<Skeleton className="h-3 w-16" />
								<Skeleton className="h-5 w-full" />
							</div>
						))}
					</div>
				</SectionCard>
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
							<PropActions prop={prop} onEdit={() => editDialog.edit(prop)} />
						}
					/>

					{editDialog.editing && (
						<FormDialog
							open={editDialog.isOpen}
							onOpenChange={() => editDialog.close()}
							title="Edit property"
							description={`Update ${editDialog.editing!.legalName} details.`}
							className={FORM_DIALOG_CLASS}
						>
							<PropsForm
								initialProp={editDialog.editing}
								onSuccess={editDialog.close}
								onCancel={editDialog.close}
								submitLabel="Update Property"
							/>
						</FormDialog>
					)}

					{/* Two-column body */}
					<div className="grid gap-4 lg:grid-cols-[1fr_260px]">
						{/* Left: main detail sections */}
						<div className="flex flex-col gap-4">
							{/* Primary Info & Details */}
							<SectionCard>
								<div className="grid gap-4 sm:grid-cols-2">
									<DetailField
										label="Legal Name"
										valueClassName="text-lg font-semibold text-foreground"
									>
										{prop.legalName}
									</DetailField>
									<DetailField label="Property Type">
										{formatEnumLabel(prop.propertyType)}
									</DetailField>
									<DetailField label="Total Area">
										{prop.totalArea != null
											? `${prop.totalArea.toLocaleString()} sq ft`
											: '—'}
									</DetailField>
									<DetailField label="Year Built">
										{prop.yearBuilt ?? '—'}
									</DetailField>
									<DetailField
										label="Parcel Number"
										valueClassName="text-foreground font-mono"
									>
										{prop.parcelNumber ?? '—'}
									</DetailField>
								</div>
							</SectionCard>

							{/* Location */}
							<SectionCard>
								<DetailField label="Location">
									<AddressDisplay
										address={prop.address}
										className="text-foreground"
									/>
								</DetailField>
							</SectionCard>

							{/* Description — conditional */}
							{prop.description && (
								<SectionCard>
									<DetailField
										label="Description"
										valueClassName="text-foreground whitespace-pre-wrap leading-relaxed"
									>
										{prop.description}
									</DetailField>
								</SectionCard>
							)}
						</div>

						{/* Right: metadata sidebar */}
						<div className="flex flex-col gap-4">
							<SectionCard>
								<div className="flex flex-col gap-4">
									<DetailField label="Version">v{prop.version}</DetailField>
									<DetailField label="Created">
										{formatDate(prop.createdAt)}
									</DetailField>
									<DetailField label="Last Updated">
										{formatDate(prop.updatedAt)}
									</DetailField>
								</div>
							</SectionCard>
						</div>
					</div>
				</div>
			)}
		</DelayedLoadingFallback>
	)
}
