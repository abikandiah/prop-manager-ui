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
import type {
	MembershipTemplateItem,
	PermissionTemplate,
} from '@/domain/permission-template'
import { FieldError } from '@/components/ui/FieldError'
import { RequiredMark } from '@/components/ui'
import {
	useCreatePermissionTemplate,
	useUpdatePermissionTemplate,
} from '@/features/permission-templates/hooks'
import { PermissionMatrixEditor } from '../PermissionMatrixEditor'

// ---------- Schema ----------

const permissionsRecord = z.record(z.string(), z.string())

const permissionTemplateSchema = z
	.object({
		name: z.string().min(1, 'Name is required').max(255),
		orgPermissions: permissionsRecord,
		propertyPermissions: permissionsRecord,
		unitPermissions: permissionsRecord,
	})
	.refine(
		(data) =>
			[
				data.orgPermissions,
				data.propertyPermissions,
				data.unitPermissions,
			].some((p) => Object.values(p).some((v) => v.trim() !== '')),
		{
			message: 'Grant at least one permission across any scope level',
			path: ['orgPermissions'],
		},
	)

type PermissionTemplateFormValues = z.infer<typeof permissionTemplateSchema>

function itemsToFormValues(items: MembershipTemplateItem[]) {
	const org = items.find((i) => i.scopeType === 'ORG')?.permissions ?? {}
	const property =
		items.find((i) => i.scopeType === 'PROPERTY')?.permissions ?? {}
	const unit = items.find((i) => i.scopeType === 'UNIT')?.permissions ?? {}
	return {
		orgPermissions: org,
		propertyPermissions: property,
		unitPermissions: unit,
	}
}

function formValuesToItems(
	values: PermissionTemplateFormValues,
): MembershipTemplateItem[] {
	const items: MembershipTemplateItem[] = []
	const hasPerms = (p: Record<string, string>) =>
		Object.values(p).some((v) => v.trim() !== '')
	if (hasPerms(values.orgPermissions))
		items.push({ scopeType: 'ORG', permissions: values.orgPermissions })
	if (hasPerms(values.propertyPermissions))
		items.push({
			scopeType: 'PROPERTY',
			permissions: values.propertyPermissions,
		})
	if (hasPerms(values.unitPermissions))
		items.push({ scopeType: 'UNIT', permissions: values.unitPermissions })
	return items
}

// ---------- Props ----------

export interface PermissionTemplateFormProps {
	/** The org this template belongs to. If undefined, creates a system template. */
	orgId?: string | null
	/** If set, the form is in edit mode. */
	initialTemplate?: PermissionTemplate | null
	/** Pre-fills create mode fields (ignored when initialTemplate is set). */
	prefill?: { name: string; items: MembershipTemplateItem[] }
	onSuccess?: () => void
	onCancel?: () => void
	submitLabel?: string
}

// ---------- Component ----------

export function PermissionTemplateForm({
	orgId,
	initialTemplate = null,
	prefill,
	onSuccess,
	onCancel,
	submitLabel = 'Create template',
}: PermissionTemplateFormProps) {
	const isEdit = initialTemplate != null
	const createTemplate = useCreatePermissionTemplate()
	const updateTemplate = useUpdatePermissionTemplate()
	const pending = createTemplate.isPending || updateTemplate.isPending

	const defaultPerms = initialTemplate
		? itemsToFormValues(initialTemplate.items)
		: prefill
			? itemsToFormValues(prefill.items)
			: { orgPermissions: {}, propertyPermissions: {}, unitPermissions: {} }

	const {
		register,
		control,
		handleSubmit,
		formState: { errors },
	} = useForm<PermissionTemplateFormValues>({
		resolver: standardSchemaResolver(permissionTemplateSchema),
		defaultValues: {
			name: initialTemplate?.name ?? prefill?.name ?? '',
			...defaultPerms,
		},
		mode: 'onTouched',
	})

	const onSubmit = useCallback(
		(values: PermissionTemplateFormValues) => {
			const items = formValuesToItems(values)
			if (isEdit) {
				updateTemplate.mutate(
					{
						id: initialTemplate.id,
						payload: {
							name: values.name.trim(),
							items,
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
						items,
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
				<Label>Organization-level permissions</Label>
				<p className="text-sm text-muted-foreground">
					Granted automatically to all holders — no resource binding needed.
				</p>
				<Controller
					name="orgPermissions"
					control={control}
					render={({ field }) => (
						<PermissionMatrixEditor
							value={field.value}
							onChange={field.onChange}
						/>
					)}
				/>
				<FieldError
					message={errors.orgPermissions?.message as string | undefined}
				/>
			</div>

			<div className="space-y-2">
				<Label>Property-level permissions</Label>
				<p className="text-sm text-muted-foreground">
					Applied per property when a binding scope row exists for that
					property.
				</p>
				<Controller
					name="propertyPermissions"
					control={control}
					render={({ field }) => (
						<PermissionMatrixEditor
							value={field.value}
							onChange={field.onChange}
						/>
					)}
				/>
			</div>

			<div className="space-y-2">
				<Label>Unit-level permissions</Label>
				<p className="text-sm text-muted-foreground">
					Applied per unit when a binding scope row exists for that unit.
				</p>
				<Controller
					name="unitPermissions"
					control={control}
					render={({ field }) => (
						<PermissionMatrixEditor
							value={field.value}
							onChange={field.onChange}
						/>
					)}
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
