import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'
import { Skeleton } from '@abumble/design-system/components/Skeleton'
import { Badge } from '@abumble/design-system/components/Badge'
import { BannerHeader } from '@abumble/design-system/components/BannerHeader'
import { DelayedLoadingFallback } from '@abumble/design-system/components/DelayedLoadingFallback'
import { FormDialog } from '@abumble/design-system/components/Dialog'
import type { LeaseTemplate } from '@/domain/lease-template'
import { LateFeeType } from '@/domain/lease'
import {
	LEASE_TEMPLATE_WIZARD_STEPS,
	LeaseTemplateFormWizard,
	useDeleteLeaseTemplate,
	useLeaseTemplateDetail,
} from '@/features/lease-templates'
import { formatCurrency, formatDate, formatEnumLabel } from '@/lib/format'
import {
	DETAIL_LABEL_CLASS,
	DetailField,
	EntityActions,
	TextLink,
} from '@/components/ui'
import { config } from '@/config'
import { CenteredEmptyState } from '@/components/CenteredEmptyState'

export const Route = createFileRoute('/leases/templates/$templateId')({
	component: LeaseTemplateDetailPage,
})

function LeaseTemplateActions({
	template,
	onEdit,
}: {
	template: LeaseTemplate
	onEdit: () => void
}) {
	const navigate = useNavigate()
	const deleteTemplate = useDeleteLeaseTemplate()

	return (
		<EntityActions
			label="Template actions"
			onEdit={onEdit}
			onDelete={() => {
				deleteTemplate.mutate(template.id, {
					onSuccess: () => {
						toast.success('Template deleted')
						navigate({ to: '/leases/templates' })
					},
					onError: (err) => {
						toast.error(err.message || 'Failed to delete template')
					},
				})
			}}
			isDeletePending={deleteTemplate.isPending}
			deleteTitle="Delete template?"
			deleteDescription={
				<>
					Template &quot;{template.name}&quot; will be removed. Existing leases
					stamped from this template will keep their content but the template
					reference will be cleared.
				</>
			}
		/>
	)
}

function LeaseTemplateDetailPage() {
	const { templateId } = Route.useParams()

	const {
		data: template,
		isLoading,
		isError,
		error,
	} = useLeaseTemplateDetail(templateId)

	const [editingTemplate, setEditingTemplate] = useState<LeaseTemplate | null>(
		null,
	)
	const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1)

	const handleEditClose = () => {
		setEditingTemplate(null)
		setWizardStep(1)
	}

	useEffect(() => {
		if (isError) {
			toast.error(`Error loading template: ${error.message || 'Unknown'}`)
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
			{isError || !template ? (
				<CenteredEmptyState
					title="Template not found"
					description={
						isError
							? error.message || 'Failed to load template'
							: 'The template you were looking for was not found.'
					}
					action={<TextLink to="/leases/templates">Back to templates</TextLink>}
				/>
			) : (
				<div className="flex flex-col gap-6">
					<BannerHeader
						linkComponent={Link}
						backLink={{ label: 'Back to templates', to: '/leases/templates' }}
						title={template.name}
						description={[
							template.versionTag && `Version ${template.versionTag}`,
							template.active ? 'Active' : 'Inactive',
						]
							.filter(Boolean)
							.join(' · ')}
						actions={
							<LeaseTemplateActions
								template={template}
								onEdit={() => setEditingTemplate(template)}
							/>
						}
					/>

					{/* Status badge */}
					<div className="flex items-center gap-3">
						<Badge variant={template.active ? 'success' : 'secondary'}>
							{template.active ? 'Active' : 'Inactive'}
						</Badge>
					</div>

					<div className="grid gap-x-8 gap-y-6 md:grid-cols-2 lg:grid-cols-3">
						{/* Group: Template Info */}
						<div className="space-y-6">
							<DetailField
								label="Template Name"
								valueClassName="text-lg font-semibold text-foreground"
							>
								{template.name}
							</DetailField>
							<DetailField label="Version Tag">
								{template.versionTag || '—'}
							</DetailField>
						</div>

						{/* Group: Default Terms */}
						<div className="space-y-6">
							<DetailField label="Default Late Fee Type">
								{template.defaultLateFeeType ? formatEnumLabel(template.defaultLateFeeType) : '—'}
							</DetailField>
							<DetailField label="Default Late Fee Amount">
								{template.defaultLateFeeAmount != null
									? template.defaultLateFeeType === LateFeeType.PERCENTAGE
										? `${template.defaultLateFeeAmount}%`
										: formatCurrency(template.defaultLateFeeAmount)
									: '—'}
							</DetailField>
							<DetailField label="Default Notice Period">
								{template.defaultNoticePeriodDays != null
									? `${template.defaultNoticePeriodDays} days`
									: '—'}
							</DetailField>
						</div>

						{/* Group: Metadata */}
						<div className="space-y-6">
							<DetailField label="Version">v{template.version}</DetailField>
							<DetailField label="Created">
								{formatDate(template.createdAt)}
							</DetailField>
							<DetailField label="Last Updated">
								{formatDate(template.updatedAt)}
							</DetailField>
						</div>

						{/* Group: Template Parameters (Full width) */}
						{Object.keys(template.templateParameters).length > 0 && (
							<div className="md:col-span-2 lg:col-span-3 border-t pt-4">
								<label className={DETAIL_LABEL_CLASS}>
									Template Parameters
								</label>
								<div className="mt-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
									{Object.entries(template.templateParameters).map(
										([key, value]) => (
											<div
												key={key}
												className="rounded-md border bg-muted/30 p-3"
											>
												<p className="text-xs font-mono text-muted-foreground">
													{'{{'}
													{key}
													{'}}'}
												</p>
												<p className="mt-1 text-sm font-medium text-foreground">
													{value || '—'}
												</p>
											</div>
										),
									)}
								</div>
							</div>
						)}

						{/* Group: Template Markdown Content (Full width) */}
						<div className="md:col-span-2 lg:col-span-3 border-t pt-4">
							<label className={DETAIL_LABEL_CLASS}>Template Content</label>
							<div className="mt-2 rounded-md border bg-muted/20 p-6">
								<div className="prose prose-sm dark:prose-invert max-w-none">
									<ReactMarkdown>{template.templateMarkdown}</ReactMarkdown>
								</div>
							</div>
						</div>
					</div>

					{editingTemplate && (
						<FormDialog
							open={!!editingTemplate}
							onOpenChange={handleEditClose}
							title="Edit template"
							description="Update template details."
							className="max-w-[calc(100vw-2rem)] sm:max-w-5xl"
							wizard={{
								currentStep: wizardStep,
								totalSteps: 3,
								stepTitle: LEASE_TEMPLATE_WIZARD_STEPS[wizardStep],
							}}
						>
							<LeaseTemplateFormWizard
								step={wizardStep}
								onStepChange={setWizardStep}
								initialTemplate={editingTemplate}
								onSuccess={handleEditClose}
								onCancel={handleEditClose}
								submitLabel="Save"
							/>
						</FormDialog>
					)}
				</div>
			)}
		</DelayedLoadingFallback>
	)
}
