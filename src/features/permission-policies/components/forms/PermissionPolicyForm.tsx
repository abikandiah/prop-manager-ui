import { useCallback } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { z } from 'zod'
import { toast } from 'sonner'
import { Check } from 'lucide-react'
import { Button } from '@abumble/design-system/components/Button'
import { DialogFooter } from '@abumble/design-system/components/Dialog'
import { Input } from '@abumble/design-system/components/Input'
import { Label } from '@abumble/design-system/components/Label'
import type { PermissionPolicy } from '@/domain/permission-policy'
import { FieldError } from '@/components/ui/FieldError'
import { RequiredMark } from '@/components/ui'
import {
	useCreatePermissionPolicy,
	useUpdatePermissionPolicy,
} from '@/features/permission-policies/hooks'
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
		mode: 'onTouched',
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
						orgId: orgId ?? null,
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
				<Label>Permissions <RequiredMark /></Label>
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

			<DialogFooter className="gap-2">
				{onCancel && (
					<Button type="button" variant="outline" onClick={onCancel}>
						Cancel
					</Button>
				)}
				<Button type="submit" disabled={pending}>
					{pending ? (
						'Saving…'
					) : (
						<>
							<Check className="h-4 w-4" />
							{submitLabel}
						</>
					)}
				</Button>
			</DialogFooter>
		</form>
	)
}
