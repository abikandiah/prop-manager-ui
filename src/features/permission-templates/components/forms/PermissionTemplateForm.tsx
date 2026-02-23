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
import type { PermissionTemplate } from '@/domain/permission-template'
import { FieldError } from '@/components/ui/FieldError'
import { RequiredMark } from '@/components/ui'
import {
	useCreatePermissionTemplate,
	useUpdatePermissionTemplate,
} from '@/features/permission-templates/hooks'
import { PermissionMatrixEditor } from '../PermissionMatrixEditor'

// ---------- Schema ----------

const permissionTemplateSchema = z
	.object({
		name: z.string().min(1, 'Name is required').max(255),
		defaultPermissions: z.record(z.string(), z.string()),
	})
	.refine(
		(data) =>
			Object.values(data.defaultPermissions).some((v) => v.trim() !== ''),
		{
			message: 'Grant at least one permission',
			path: ['defaultPermissions'],
		},
	)

type PermissionTemplateFormValues = z.infer<typeof permissionTemplateSchema>

// ---------- Props ----------

export interface PermissionTemplateFormProps {
	/** The org this template belongs to. If undefined, creates a system template. */
	orgId?: string | null
	/** If set, the form is in edit mode. */
	initialTemplate?: PermissionTemplate | null
	onSuccess?: () => void
	onCancel?: () => void
	submitLabel?: string
}

// ---------- Component ----------

export function PermissionTemplateForm({
	orgId,
	initialTemplate = null,
	onSuccess,
	onCancel,
	submitLabel = 'Create template',
}: PermissionTemplateFormProps) {
	const isEdit = initialTemplate != null
	const createTemplate = useCreatePermissionTemplate()
	const updateTemplate = useUpdatePermissionTemplate()
	const pending = createTemplate.isPending || updateTemplate.isPending

	const {
		register,
		control,
		handleSubmit,
		formState: { errors },
	} = useForm<PermissionTemplateFormValues>({
		resolver: standardSchemaResolver(permissionTemplateSchema),
		defaultValues: initialTemplate
			? {
					name: initialTemplate.name,
					defaultPermissions: initialTemplate.defaultPermissions,
				}
			: {
					name: '',
					defaultPermissions: {},
				},
		mode: 'onTouched',
	})

	const onSubmit = useCallback(
		(values: PermissionTemplateFormValues) => {
			if (isEdit) {
				updateTemplate.mutate(
					{
						id: initialTemplate.id,
						payload: {
							name: values.name.trim(),
							defaultPermissions: values.defaultPermissions,
							version: initialTemplate.version,
						},
					},
					{
						onSuccess: () => {
							toast.success('Template updated')
							onSuccess?.()
						},
					},
				)
			} else {
				createTemplate.mutate(
					{
						name: values.name.trim(),
						orgId: orgId ?? null,
						defaultPermissions: values.defaultPermissions,
					},
					{
						onSuccess: () => {
							toast.success('Template created')
							onSuccess?.()
						},
					},
				)
			}
		},
		[isEdit, initialTemplate, orgId, createTemplate, updateTemplate, onSuccess],
	)

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-4">
			<div className="space-y-2">
				<Label htmlFor="name">
					Template name <RequiredMark />
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
				<Label>Permissions</Label>
				<p className="text-sm text-muted-foreground">
					Choose which actions to grant for each domain.
				</p>
				<Controller
					name="defaultPermissions"
					control={control}
					render={({ field }) => (
						<PermissionMatrixEditor
							value={field.value}
							onChange={field.onChange}
						/>
					)}
				/>
				<FieldError message={errors.defaultPermissions?.message} />
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
