import { useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { z } from 'zod'
import { toast } from 'sonner'
import { Check } from 'lucide-react'
import { Button } from '@abumble/design-system/components/Button'
import { DialogFooter } from '@abumble/design-system/components/Dialog'
import { FieldError } from '@/components/ui/FieldError'
import type { AssignmentConfigValue, ResourceType } from '@/domain/policy-assignment'
import { useCreatePolicyAssignment } from '../../hooks'
import { AssignmentConfigurator } from '../AssignmentConfigurator'

// ---------- Schema ----------

const assignmentSchema = z
	.object({
		resourceType: z.enum(['ORG', 'PROPERTY', 'UNIT']),
		resourceId: z.string().min(1, 'Resource is required'),
		usePolicy: z.boolean(),
		policyId: z.string().optional(),
		overrides: z.record(z.string(), z.string()),
	})
	.refine(
		(data) => {
			if (data.usePolicy) return !!data.policyId
			return Object.values(data.overrides).some((v) => v.trim() !== '')
		},
		{
			message: 'Select a policy or grant at least one custom permission',
			path: ['policyId'],
		},
	)

type CreateAssignmentFormValues = z.infer<typeof assignmentSchema>

// ---------- Props ----------

export interface CreateAssignmentFormProps {
	orgId: string
	membershipId: string
	onSuccess?: () => void
	onCancel?: () => void
}

// ---------- Component ----------

export function CreateAssignmentForm({
	orgId,
	membershipId,
	onSuccess,
	onCancel,
}: CreateAssignmentFormProps) {
	const createAssignment = useCreatePolicyAssignment()

	const {
		watch,
		setValue,
		handleSubmit,
		formState: { errors },
	} = useForm<CreateAssignmentFormValues>({
		resolver: standardSchemaResolver(assignmentSchema),
		defaultValues: {
			resourceType: 'PROPERTY',
			resourceId: '',
			usePolicy: true,
			policyId: undefined,
			overrides: {},
		},
		mode: 'onTouched',
	})

	const formValues = watch()
	const configValue: AssignmentConfigValue = {
		resourceType: formValues.resourceType as ResourceType,
		resourceId: formValues.resourceId,
		usePolicy: formValues.usePolicy,
		policyId: formValues.policyId,
		overrides: formValues.overrides,
	}

	const handleConfigChange = (next: AssignmentConfigValue) => {
		setValue('resourceType', next.resourceType, { shouldValidate: true })
		setValue('resourceId', next.resourceId, { shouldValidate: true })
		setValue('usePolicy', next.usePolicy)
		setValue('policyId', next.policyId)
		setValue('overrides', next.overrides)
	}

	const onSubmit = useCallback(
		(values: CreateAssignmentFormValues) => {
			const resourceId =
				values.resourceType === 'ORG' ? orgId : values.resourceId

			createAssignment.mutate(
				{
					orgId,
					membershipId,
					payload: {
						resourceType: values.resourceType,
						resourceId,
						policyId: values.usePolicy ? values.policyId : null,
						overrides: !values.usePolicy ? values.overrides : null,
					},
				},
				{
					onSuccess: () => {
						toast.success('Assignment added')
						onSuccess?.()
					},
				},
			)
		},
		[orgId, membershipId, createAssignment, onSuccess],
	)

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-4">
			<AssignmentConfigurator
				orgId={orgId}
				value={configValue}
				onChange={handleConfigChange}
				errors={{
					resourceType: errors.resourceType,
					resourceId: errors.resourceId,
					overrides: errors.overrides,
				}}
			/>
			<FieldError message={errors.policyId?.message} />

			<DialogFooter className="gap-2">
				{onCancel && (
					<Button type="button" variant="outline" onClick={onCancel}>
						Cancel
					</Button>
				)}
				<Button type="submit" disabled={createAssignment.isPending}>
					{createAssignment.isPending ? (
						'Adding…'
					) : (
						<>
							<Check className="h-4 w-4" />
							Add assignment
						</>
					)}
				</Button>
			</DialogFooter>
		</form>
	)
}
