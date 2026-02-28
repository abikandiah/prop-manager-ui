import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { Badge } from '@abumble/design-system/components/Badge'
import { Button } from '@abumble/design-system/components/Button'
import {
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/ui/accordion'
import { PermissionMatrixEditor } from '@/features/permission-policies/components/PermissionMatrixEditor'
import { usePermissionPolicies } from '@/features/permission-policies/hooks'
import type { PolicyAssignment } from '@/domain/policy-assignment'
import { useUpdatePolicyAssignment, useDeletePolicyAssignment } from '../hooks'
import type { UpdatePolicyAssignmentPayload } from '@/domain/policy-assignment'

export interface AssignmentAccordionItemProps {
	orgId: string
	membershipId: string
	assignment: PolicyAssignment
	resourceName: string
	isEditing: boolean
	onEdit: () => void
	onCancelEdit: () => void
	onSaveSuccess: () => void
}

export function AssignmentAccordionItem({
	orgId,
	membershipId,
	assignment,
	resourceName,
	isEditing,
	onEdit,
	onCancelEdit,
	onSaveSuccess,
}: AssignmentAccordionItemProps) {
	const { data: policies } = usePermissionPolicies(orgId)
	const updateAssignment = useUpdatePolicyAssignment()
	const deleteAssignment = useDeletePolicyAssignment()

	const policyName = assignment.policyId
		? policies?.find((p) => p.id === assignment.policyId)?.name
		: null

	const handleSave = (payload: UpdatePolicyAssignmentPayload) => {
		updateAssignment.mutate(
			{ orgId, membershipId, assignmentId: assignment.id, payload },
			{
				onSuccess: () => {
					toast.success('Assignment updated')
					onSaveSuccess()
				},
			},
		)
	}

	const handleDelete = () => {
		deleteAssignment.mutate(
			{ orgId, membershipId, assignmentId: assignment.id },
			{ onSuccess: () => toast.success('Assignment removed') },
		)
	}

	const effectivePermissions =
		assignment.overrides ??
		policies?.find((p) => p.id === assignment.policyId)?.permissions ??
		{}

	return (
		<AccordionItem value={assignment.id} className="border rounded-md px-2">
			<AccordionTrigger className="hover:no-underline py-2">
				<div className="flex flex-1 items-center justify-between mr-4">
					<div className="flex items-center gap-2">
						<span className="font-medium text-sm">{resourceName}</span>
						<Badge variant="outline" className="text-xs">
							{assignment.resourceType}
						</Badge>
						{policyName ? (
							<Badge variant="secondary" className="text-xs">
								{policyName}
							</Badge>
						) : (
							<Badge variant="secondary" className="text-xs">
								Custom
							</Badge>
						)}
					</div>
					<div
						className="flex items-center gap-1"
						onClick={(e) => e.stopPropagation()}
					>
						{!isEditing && (
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="h-7 px-2 text-xs"
								onClick={onEdit}
							>
								Edit
							</Button>
						)}
						<Button
							type="button"
							variant="ghost"
							size="icon"
							className="h-7 w-7 text-destructive hover:text-destructive"
							onClick={handleDelete}
							disabled={deleteAssignment.isPending}
						>
							<Trash2 className="h-4 w-4" />
							<span className="sr-only">Remove assignment</span>
						</Button>
					</div>
				</div>
			</AccordionTrigger>
			<AccordionContent className="pt-0 pb-4 px-2">
				{isEditing ? (
					<EditAssignmentInline
						assignment={assignment}
						orgId={orgId}
						onSave={handleSave}
						onCancel={onCancelEdit}
						isSaving={updateAssignment.isPending}
					/>
				) : (
					<PermissionMatrixEditor value={effectivePermissions} readOnly />
				)}
			</AccordionContent>
		</AccordionItem>
	)
}

// ---------- Inline edit ----------

interface EditAssignmentInlineProps {
	assignment: PolicyAssignment
	orgId: string
	onSave: (payload: UpdatePolicyAssignmentPayload) => void
	onCancel: () => void
	isSaving: boolean
}

function EditAssignmentInline({
	assignment,
	onSave,
	onCancel,
	isSaving,
}: EditAssignmentInlineProps) {
	const hasOverrides = assignment.overrides != null

	const handlePermissionsChange = (perms: Record<string, string>) => {
		onSave({
			overrides: perms,
			version: assignment.version,
		})
	}

	if (hasOverrides) {
		return (
			<div className="space-y-3">
				<PermissionMatrixEditor
					value={assignment.overrides ?? {}}
					onChange={handlePermissionsChange}
				/>
				<div className="flex gap-2 justify-end">
					<Button type="button" variant="outline" size="sm" onClick={onCancel}>
						Cancel
					</Button>
				</div>
			</div>
		)
	}

	// Policy-based assignment: just show cancel (policy changes are done on the policy itself)
	return (
		<div className="space-y-3">
			<p className="text-sm text-muted-foreground">
				This assignment uses a policy. Edit the policy to change the
				permissions, or remove this assignment and create a new one with custom
				permissions.
			</p>
			<div className="flex gap-2 justify-end">
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={onCancel}
					disabled={isSaving}
				>
					Close
				</Button>
			</div>
		</div>
	)
}
