import { useRef, useState } from 'react'
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
import type { PermissionTemplate } from '@/domain/permission-template'
import { TableSkeleton, EntityActions } from '@/components/ui'
import { config } from '@/config'
import { formatDate } from '@/lib/format'
import {
	useDeletePermissionTemplate,
	usePermissionTemplates,
} from '../../hooks'
import { PermissionTemplateForm } from '../forms/PermissionTemplateForm'
import { FORM_DIALOG_CLASS } from '@/lib/dialog'

export interface PermissionTemplatesTableViewProps {
	orgId: string
}

/** Summarises template items as a short human-readable string, e.g. "ORG: l:rcud · PROPERTY: m:r". */
function formatItems(items: PermissionTemplate['items']): string {
	if (!items || items.length === 0) return '—'
	return items
		.map((item) => {
			const perms = Object.entries(item.permissions)
				.filter(([, v]) => v)
				.map(([k, v]) => `${k}:${v}`)
				.join(' ')
			return `${item.scopeType}: ${perms}`
		})
		.join(' · ')
}

export function PermissionTemplatesTableView({
	orgId,
}: PermissionTemplatesTableViewProps) {
	const {
		data: templates,
		isLoading,
		isError,
		error,
	} = usePermissionTemplates(orgId)
	const deleteTemplate = useDeletePermissionTemplate()
	const [editing, setEditing] = useState<PermissionTemplate | null>(null)

	const lastErrorRef = useRef<unknown>(null)
	if (isError && error !== lastErrorRef.current) {
		lastErrorRef.current = error
		toast.error(
			`Error loading templates: ${(error as Error).message ?? 'Unknown'}`,
		)
	}
	if (!isError) lastErrorRef.current = null

	const handleDelete = (template: PermissionTemplate) => {
		deleteTemplate.mutate(template.id, {
			onSuccess: () => toast.success(`Template "${template.name}" deleted`),
		})
	}

	const skeletonTable = (
		<TableSkeleton
			headers={['Name', 'Scope', 'Permissions', 'Created']}
			columnWidths={['w-48', 'w-24', 'w-64', 'w-24']}
		/>
	)

	return (
		<>
			<FormDialog
				open={editing !== null}
				onOpenChange={(open) => {
					if (!open) setEditing(null)
				}}
				title="Edit template"
				description="Update the template name or permissions."
				className={FORM_DIALOG_CLASS}
			>
				{editing && (
					<PermissionTemplateForm
						orgId={editing.orgId}
						initialTemplate={editing}
						onSuccess={() => setEditing(null)}
						onCancel={() => setEditing(null)}
						submitLabel="Save changes"
					/>
				)}
			</FormDialog>

			<DelayedLoadingFallback
				isLoading={isLoading}
				delayMs={config.loadingFallbackDelayMs}
				fallback={skeletonTable}
			>
				<div className="rounded border bg-card overflow-hidden">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Name</TableHead>
								<TableHead>Scope</TableHead>
								<TableHead>Permissions</TableHead>
								<TableHead>Created</TableHead>
								<TableHead className="w-10" />
							</TableRow>
						</TableHeader>
						<TableBody>
							{!templates || templates.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={5}
										className="h-24 text-center text-muted-foreground"
									>
										No templates yet. Create one above.
									</TableCell>
								</TableRow>
							) : (
								templates.map((template) => (
									<TableRow key={template.id}>
										<TableCell className="font-medium">
											{template.name}
										</TableCell>
										<TableCell className="text-muted-foreground text-sm">
											{template.orgId === null ? 'System' : 'Organization'}
										</TableCell>
										<TableCell className="text-muted-foreground text-sm font-mono">
											{formatItems(template.items)}
										</TableCell>
										<TableCell className="text-muted-foreground">
											{formatDate(template.createdAt)}
										</TableCell>
										<TableCell>
											<EntityActions
												onEdit={() => setEditing(template)}
												onDelete={() => handleDelete(template)}
												isDeletePending={deleteTemplate.isPending}
												deleteTitle={`Delete "${template.name}"?`}
												deleteDescription="This template will be permanently removed. Scopes that used it will keep their current permissions."
												stopTriggerPropagation
											/>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</div>
			</DelayedLoadingFallback>
		</>
	)
}
