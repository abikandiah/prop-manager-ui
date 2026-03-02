import { FieldError, FormFooter, RequiredMark } from '@/components/ui'
import type { PermissionPolicy } from '@/domain/permission-policy'
import {
	useCreatePermissionPolicy,
	useUpdatePermissionPolicy,
} from '@/features/permission-policies/hooks'
import { Input } from '@abumble/design-system/components/Input'
import { Label } from '@abumble/design-system/components/Label'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { Check } from 'lucide-react'
import { useCallback } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { PermissionMatrixEditor } from '../PermissionMatrixEditor'

// ---------- Schema ----------

const permissionPolicySchema = z
	.object({
		name: z.string().min(1, 'Name is required').max(255),
		permissions: z.record(z.string(), z.string()),
	})
	.refine(
		(data) => Object.values(data.permissions).some((v) => v.trim() !== ''),
		{
			message: 'Grant at least one permission',
			path: ['permissions'],
		},
	)

type PermissionPolicyFormValues = z.infer<typeof permissionPolicySchema>

// ---------- Props ----------

export interface PermissionPolicyFormProps {
	/** The org this policy belongs to. If undefined, creates a system policy. */
	orgId?: string | null
	/** If set, the form is in edit mode. */
	initialPolicy?: PermissionPolicy | null
	/** Pre-fills create mode fields (ignored when initialPolicy is set). */
	prefill?: { name: string; permissions: Record<string, string> }
	onSuccess?: () => void
	onCancel?: () => void
	submitLabel?: string
}

// ---------- Component ----------

export function PermissionPolicyForm({
	orgId,
	initialPolicy = null,
	prefill,
	onSuccess,
	onCancel,
	submitLabel = 'Create policy',
}: PermissionPolicyFormProps) {
	const isEdit = initialPolicy != null
	const createPolicy = useCreatePermissionPolicy()
	const updatePolicy = useUpdatePermissionPolicy()
	const pending = createPolicy.isPending || updatePolicy.isPending

	const {
		register,
		control,
		handleSubmit,
		formState: { errors },
	} = useForm<PermissionPolicyFormValues>({
		resolver: standardSchemaResolver(permissionPolicySchema),
		defaultValues: {
			name: initialPolicy?.name ?? prefill?.name ?? '',
			permissions: initialPolicy?.permissions ?? prefill?.permissions ?? {},
		},
		mode: 'onSubmit',
		reValidateMode: 'onChange',
	})

	const onSubmit = useCallback(
		(values: PermissionPolicyFormValues) => {
			if (isEdit) {
				updatePolicy.mutate(
					{
						id: initialPolicy.id,
						payload: {
							name: values.name.trim(),
							permissions: values.permissions,
							version: initialPolicy.version,
						},
					},
					{
						onSuccess: () => {
							toast.success('Policy updated')
							onSuccess?.()
						},
					},
				)
			} else {
				createPolicy.mutate(
					{
						name: values.name.trim(),
						permissions: values.permissions,
					},
					{
						onSuccess: () => {
							toast.success('Policy created')
							onSuccess?.()
						},
					},
				)
			}
		},
		[isEdit, initialPolicy, orgId, createPolicy, updatePolicy, onSuccess],
	)

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-4">
			<div className="space-y-2">
				<Label htmlFor="name">
					Policy name <RequiredMark />
				</Label>
				<Input
					id="name"
					{...register('name')}
					placeholder="e.g. Property Manager — Full Access"
					maxLength={255}
				/>
				<FieldError message={errors.name?.message} />
			</div>

			<div className="space-y-2">
				<Label>
					Permissions <RequiredMark />
				</Label>
				<Controller
					name="permissions"
					control={control}
					render={({ field }) => (
						<PermissionMatrixEditor
							value={field.value}
							onChange={field.onChange}
						/>
					)}
				/>
				<FieldError
					message={errors.permissions?.message as string | undefined}
				/>
			</div>

			<FormFooter
				className="gap-2"
				pending={pending}
				onCancel={onCancel}
				submitLabel={
					<>
						<Check className="h-4 w-4" />
						{submitLabel}
					</>
				}
			/>
		</form>
	)
}
