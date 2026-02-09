import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Skeleton } from '@abumble/design-system/components/Skeleton'
import { useNavigate } from '@tanstack/react-router'
import { LeaseTemplateForm } from '../forms/LeaseTemplateForm'
import type { LeaseTemplate } from '@/domain/lease-template'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import {
	ActionsPopover,
	ConfirmDeleteDialog,
	DelayedLoadingFallback,
	FormDialog,
} from '@/components/ui'
import {
	useDeleteLeaseTemplate,
	useLeaseTemplatesActive,
	useLeaseTemplatesList,
} from '@/features/lease-templates/hooks'
import { formatDate } from '@/lib/format'

function LeaseTemplateRowActions({
	template,
	onEdit,
}: {
	template: LeaseTemplate
	onEdit: () => void
}) {
	const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
	const deleteTemplate = useDeleteLeaseTemplate()

	const handleDeleteConfirm = () => {
		deleteTemplate.mutate(template.id, {
			onSuccess: () => {
				setDeleteConfirmOpen(false)
				toast.success('Template deleted')
			},
			onError: (err) => {
				toast.error(err.message || 'Failed to delete template')
			},
		})
	}

	return (
		<>
			<ActionsPopover
				label="Template actions"
				onEdit={onEdit}
				onDelete={() => setDeleteConfirmOpen(true)}
				isDeleteDisabled={deleteTemplate.isPending}
				stopTriggerPropagation
			/>
			<ConfirmDeleteDialog
				open={deleteConfirmOpen}
				onOpenChange={setDeleteConfirmOpen}
				title="Delete template?"
				description={
					<>
						Template &quot;{template.name}&quot; will be removed. Existing
						leases stamped from this template will keep their content but the
						template reference will be cleared.
					</>
				}
				onConfirm={handleDeleteConfirm}
				isPending={deleteTemplate.isPending}
			/>
		</>
	)
}

export interface LeaseTemplatesTableViewProps {
	activeOnly?: boolean
}

export function LeaseTemplatesTableView({
	activeOnly = false,
}: LeaseTemplatesTableViewProps) {
	const navigate = useNavigate()
	const allTemplates = useLeaseTemplatesList()
	const activeTemplates = useLeaseTemplatesActive()

	const {
		data: templates,
		isLoading,
		isError,
		error,
	} = activeOnly ? activeTemplates : allTemplates

	const [editingTemplate, setEditingTemplate] = useState<LeaseTemplate | null>(
		null,
	)

	const handleRowClick = (template: LeaseTemplate) => {
		setEditingTemplate(template)
	}

	useEffect(() => {
		if (isError) {
			toast.error(`Error loading templates: ${error.message || 'Unknown'}`)
		}
	}, [isError, error])

	const skeletonTable = (
		<div className="rounded border bg-card overflow-hidden">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Name</TableHead>
						<TableHead>Version</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Late fee</TableHead>
						<TableHead>Notice period</TableHead>
						<TableHead>Created</TableHead>
						<TableHead className="w-12" />
					</TableRow>
				</TableHeader>
				<TableBody>
					{Array.from({ length: 3 }).map((_, i) => (
						<TableRow key={i}>
							<TableCell>
								<Skeleton className="h-6 w-48" />
							</TableCell>
							<TableCell>
								<Skeleton className="h-6 w-16" />
							</TableCell>
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
								<Skeleton className="h-6 w-24" />
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
								<TableHead>Name</TableHead>
								<TableHead>Version</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Late fee</TableHead>
								<TableHead>Notice period</TableHead>
								<TableHead>Created</TableHead>
								<TableHead className="w-12" />
							</TableRow>
						</TableHeader>
						<TableBody>
							{!templates || templates.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={7}
										className="h-24 text-center text-muted-foreground"
									>
										No templates yet. Create one above.
									</TableCell>
								</TableRow>
							) : (
								templates.map((template) => (
									<TableRow
										key={template.id}
										className="cursor-pointer hover:bg-muted/50"
										onClick={() => handleRowClick(template)}
									>
										<TableCell className="font-medium">
											{template.name}
										</TableCell>
										<TableCell className="text-muted-foreground">
											{template.versionTag || '—'}
										</TableCell>
										<TableCell>
											<span
												className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
													template.active
														? 'bg-green-50 text-green-700'
														: 'bg-gray-50 text-gray-700'
												}`}
											>
												{template.active ? 'Active' : 'Inactive'}
											</span>
										</TableCell>
										<TableCell className="text-muted-foreground">
											{template.defaultLateFeeType
												? `${template.defaultLateFeeType.replace(/_/g, ' ')} ${template.defaultLateFeeAmount ? `($${template.defaultLateFeeAmount})` : ''}`
												: '—'}
										</TableCell>
										<TableCell className="text-muted-foreground">
											{template.defaultNoticePeriodDays != null
												? `${template.defaultNoticePeriodDays} days`
												: '—'}
										</TableCell>
										<TableCell className="text-muted-foreground">
											{formatDate(template.createdAt)}
										</TableCell>
										<TableCell onClick={(e) => e.stopPropagation()}>
											<LeaseTemplateRowActions
												template={template}
												onEdit={() => setEditingTemplate(template)}
											/>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</div>

				{editingTemplate && (
					<FormDialog
						open={!!editingTemplate}
						onOpenChange={() => setEditingTemplate(null)}
						title="Edit template"
						description="Update template details."
					>
						<LeaseTemplateForm
							initialTemplate={editingTemplate}
							onSuccess={() => setEditingTemplate(null)}
							onCancel={() => setEditingTemplate(null)}
							submitLabel="Save"
						/>
					</FormDialog>
				)}
			</>
		</DelayedLoadingFallback>
	)
}
