import { EntityActions } from '@/components/ui'
import {
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/ui/accordion'
import type {
	PolicyAssignment,
	UpdatePolicyAssignmentPayload,
} from '@/domain/policy-assignment'
import { PermissionMatrixEditor } from '@/features/permission-policies/components/PermissionMatrixEditor'
import { usePermissionPolicies } from '@/features/permission-policies/hooks'
import { FORM_DIALOG_CLASS } from '@/lib/dialog'
import { Badge } from '@abumble/design-system/components/Badge'
import { Button } from '@abumble/design-system/components/Button'
import { FormDialog } from '@abumble/design-system/components/Dialog'
import { useState } from 'react'
import { toast } from 'sonner'
import { useDeletePolicyAssignment, useUpdatePolicyAssignment } from '../hooks'

export interface AssignmentAccordionItemProps {
	orgId: string
	membershipId: string
	assignment: PolicyAssignment
	resourceName: string
}

export function AssignmentAccordionItem({
	orgId,
	membershipId,
	assignment,
	resourceName,
}: AssignmentAccordionItemProps) {
	const { data: policies } = usePermissionPolicies(orgId)
	const updateAssignment = useUpdatePolicyAssignment()
	const deleteAssignment = useDeletePolicyAssignment()

	const [editOpen, setEditOpen] = useState(false)

	const policyName = assignment.policyId
		? policies?.find((p) => p.id === assignment.policyId)?.name
		: null

	const hasOverrides = assignment.overrides != null

	const effectivePermissions =
		assignment.overrides ??
		policies?.find((p) => p.id === assignment.policyId)?.permissions ??
		{}

	const handleDelete = () => {
		deleteAssignment.mutate(
			{ orgId, membershipId, assignmentId: assignment.id },
			{ onSuccess: () => toast.success('Assignment removed') },
		)
	}

	const handleSave = (payload: UpdatePolicyAssignmentPayload) => {
		updateAssignment.mutate(
			{ orgId, membershipId, assignmentId: assignment.id, payload },
			{
				onSuccess: () => {
					toast.success('Assignment updated')
					setEditOpen(false)
				},
			},
		)
	}

	return (
		<>
			<AccordionItem value={assignment.id} className="border-b last:border-b-0">
				<AccordionTrigger className="hover:no-underline py-3">
					<div className="flex flex-1 items-center gap-2 min-w-0">
						<span className="font-medium text-sm truncate">{resourceName}</span>
						<Badge variant="outline" className="text-xs shrink-0">
							{assignment.resourceType}
						</Badge>
						<Badge variant="secondary" className="text-xs shrink-0">
							{policyName ?? 'Custom'}
						</Badge>
					</div>
					<div
						className="flex items-center"
						onClick={(e) => e.stopPropagation()}
					>
						<EntityActions
							label="Assignment actions"
							onEdit={hasOverrides ? () => setEditOpen(true) : false}
							onDelete={handleDelete}
							isDeletePending={deleteAssignment.isPending}
							deleteTitle="Remove assignment?"
							deleteDescription="This will remove the permission assignment from this member."
							stopTriggerPropagation
						/>
					</div>
				</AccordionTrigger>
				<AccordionContent className="pb-4 pt-0">
					<PermissionMatrixEditor value={effectivePermissions} readOnly />
				</AccordionContent>
			</AccordionItem>

			{hasOverrides && (
				<FormDialog
					open={editOpen}
					onOpenChange={setEditOpen}
					title="Edit permissions"
					description={`Update custom permissions for ${resourceName}.`}
					className={FORM_DIALOG_CLASS}
				>
					<EditCustomPermissionsForm
						assignment={assignment}
						onSave={handleSave}
						onCancel={() => setEditOpen(false)}
						isSaving={updateAssignment.isPending}
					/>
				</FormDialog>
			)}
		</>
	)
}

// ---------- Edit custom permissions form ----------

interface EditCustomPermissionsFormProps {
	assignment: PolicyAssignment
	onSave: (payload: UpdatePolicyAssignmentPayload) => void
	onCancel: () => void
	isSaving: boolean
}

function EditCustomPermissionsForm({
	assignment,
	onSave,
	onCancel,
	isSaving,
}: EditCustomPermissionsFormProps) {
	const [overrides, setOverrides] = useState<Record<string, string>>(
		assignment.overrides ?? {},
	)

	return (
		<div className="space-y-4">
			<PermissionMatrixEditor value={overrides} onChange={setOverrides} />
			<div className="flex justify-end gap-2">
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={onCancel}
					disabled={isSaving}
				>
					Cancel
				</Button>
				<Button
					type="button"
					size="sm"
					onClick={() => onSave({ overrides, version: assignment.version })}
					disabled={isSaving}
				>
					{isSaving ? 'Saving…' : 'Save'}
				</Button>
			</div>
		</div>
	)
}
