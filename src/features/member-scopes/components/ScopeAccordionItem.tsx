import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Pencil, Trash2, Save } from 'lucide-react'
import {
	AccordionItem,
	AccordionTrigger,
	AccordionContent,
} from '@/components/ui/accordion'
import { Button } from '@abumble/design-system/components/Button'
import { Badge } from '@abumble/design-system/components/Badge'
import { ConfirmDeleteDialog } from '@abumble/design-system/components/ConfirmDeleteDialog'
import { PermissionMatrixEditor } from '@/features/permission-templates'
import { useUpdateMemberScope, useDeleteMemberScope } from '@/features/member-scopes/hooks'
import type { MemberScope } from '@/domain/member-scope'

export interface ScopeAccordionItemProps {
	orgId: string
	membershipId: string
	scope: MemberScope
	/** Resolved name of the resource (e.g. Prop Name or Unit Number) */
	resourceName?: string
	/** Permissions inherited from the membership's main template */
	inheritedPermissions?: Record<string, string>
	isEditing: boolean
	onEdit: () => void
	onCancelEdit: () => void
	onSaveSuccess: () => void
}

export function ScopeAccordionItem({
	orgId,
	membershipId,
	scope,
	resourceName,
	inheritedPermissions,
	isEditing,
	onEdit,
	onCancelEdit,
	onSaveSuccess,
}: ScopeAccordionItemProps) {
	const updateScope = useUpdateMemberScope()
	const deleteScope = useDeleteMemberScope()
	const [deleteOpen, setDeleteOpen] = useState(false)

	// Editing state — simple permissions map, no ScopeConfigValue needed
	const [editPermissions, setEditPermissions] = useState<Record<string, string>>(
		scope.permissions,
	)

	// Reset to server state whenever edit mode opens
	useEffect(() => {
		if (isEditing) setEditPermissions(scope.permissions)
	}, [isEditing]) // eslint-disable-line react-hooks/exhaustive-deps

	const handleSave = () => {
		updateScope.mutate(
			{
				orgId,
				membershipId,
				scopeId: scope.id,
				payload: {
					version: scope.version,
					permissions: editPermissions,
				},
			},
			{
				onSuccess: () => {
					toast.success('Scope updated')
					onSaveSuccess()
				},
			},
		)
	}

	const handleDelete = () => {
		setDeleteOpen(false)
		deleteScope.mutate(
			{ orgId, membershipId, scopeId: scope.id },
			{
				onSuccess: () => toast.success('Scope removed'),
			},
		)
	}

	return (
		<>
			<AccordionItem value={scope.id}>
				<AccordionTrigger className="hover:no-underline">
					<div className="flex flex-1 items-center justify-between mr-4">
						<div className="flex items-center gap-3">
							<Badge variant="outline">{scope.scopeType}</Badge>
							<span className="font-medium">
								{resourceName || scope.scopeId}
							</span>
							{scope.scopeType === 'ORG' && (
								<span className="text-xs text-muted-foreground ml-2">
									(Organization-wide)
								</span>
							)}
						</div>

						{!isEditing && (
							<div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
								<Button
									variant="ghost"
									size="icon"
									className="h-8 w-8"
									onClick={(e) => {
										e.stopPropagation()
										onEdit()
									}}
								>
									<Pencil className="h-4 w-4" />
									<span className="sr-only">Edit</span>
								</Button>
								<Button
									variant="ghost"
									size="icon"
									className="h-8 w-8 text-destructive hover:text-destructive"
									onClick={(e) => {
										e.stopPropagation()
										setDeleteOpen(true)
									}}
								>
									<Trash2 className="h-4 w-4" />
									<span className="sr-only">Remove</span>
								</Button>
							</div>
						)}
					</div>
				</AccordionTrigger>

				<AccordionContent className="px-1 pt-2 pb-4">
					{isEditing ? (
						<div className="space-y-4 border rounded-md p-4 bg-muted/10">
							<PermissionMatrixEditor
								value={editPermissions}
								onChange={setEditPermissions}
								inheritedPermissions={inheritedPermissions}
							/>
							<div className="flex justify-end gap-2">
								<Button
									variant="ghost"
									size="sm"
									onClick={onCancelEdit}
									disabled={updateScope.isPending}
								>
									Cancel
								</Button>
								<Button
									size="sm"
									onClick={handleSave}
									disabled={updateScope.isPending}
								>
									<Save className="mr-2 h-4 w-4" />
									Save Changes
								</Button>
							</div>
						</div>
					) : (
						<div className="pl-2">
							<PermissionMatrixEditor
								value={scope.permissions}
								inheritedPermissions={inheritedPermissions}
								readOnly
							/>
						</div>
					)}
				</AccordionContent>
			</AccordionItem>

			<ConfirmDeleteDialog
				open={deleteOpen}
				onOpenChange={setDeleteOpen}
				title="Remove scope?"
				description={`This will revoke all permissions granted by this ${scope.scopeType} scope.`}
				onConfirm={handleDelete}
				isPending={deleteScope.isPending}
			/>
		</>
	)
}
