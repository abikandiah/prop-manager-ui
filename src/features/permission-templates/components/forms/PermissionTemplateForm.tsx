import { useCallback } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { z } from 'zod'
import { toast } from 'sonner'
import { Check } from 'lucide-react'
import { Button } from '@abumble/design-system/components/Button'
import { Badge } from '@abumble/design-system/components/Badge'
import { DialogFooter } from '@abumble/design-system/components/Dialog'
import { Input } from '@abumble/design-system/components/Input'
import { Label } from '@abumble/design-system/components/Label'
import {
	Accordion,
	AccordionItem,
	AccordionTrigger,
	AccordionContent,
} from '@/components/ui/accordion'
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

function countPermissions(perms: Record<string, string>) {
	return Object.values(perms).reduce((acc, val) => acc + val.length, 0)
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
		watch,
		formState: { errors },
	} = useForm<PermissionTemplateFormValues>({
		resolver: standardSchemaResolver(permissionTemplateSchema),
		defaultValues: {
			name: initialTemplate?.name ?? prefill?.name ?? '',
			...defaultPerms,
		},
		mode: 'onTouched',
	})

	const orgPerms = watch('orgPermissions')
	const propPerms = watch('propertyPermissions')
	const unitPerms = watch('unitPermissions')

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

			<Accordion
				type="multiple"
				defaultValue={['org']}
				className="w-full space-y-2"
			>
				<AccordionItem value="org" className="border rounded-md px-2">
					<AccordionTrigger className="hover:no-underline py-2">
						<div className="flex items-center gap-2">
							<span>Organization-level permissions</span>
							{countPermissions(orgPerms) > 0 && (
								<Badge variant="secondary" className="text-xs h-5 px-1.5">
									{countPermissions(orgPerms)}
								</Badge>
							)}
						</div>
					</AccordionTrigger>
					<AccordionContent className="pt-0 pb-4 px-1">
						<p className="text-sm text-muted-foreground mb-3">
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
					</AccordionContent>
				</AccordionItem>

				<AccordionItem value="prop" className="border rounded-md px-2">
					<AccordionTrigger className="hover:no-underline py-2">
						<div className="flex items-center gap-2">
							<span>Property-level permissions</span>
							{countPermissions(propPerms) > 0 && (
								<Badge variant="secondary" className="text-xs h-5 px-1.5">
									{countPermissions(propPerms)}
								</Badge>
							)}
						</div>
					</AccordionTrigger>
					<AccordionContent className="pt-0 pb-4 px-1">
						<p className="text-sm text-muted-foreground mb-3">
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
					</AccordionContent>
				</AccordionItem>

				<AccordionItem value="unit" className="border rounded-md px-2">
					<AccordionTrigger className="hover:no-underline py-2">
						<div className="flex items-center gap-2">
							<span>Unit-level permissions</span>
							{countPermissions(unitPerms) > 0 && (
								<Badge variant="secondary" className="text-xs h-5 px-1.5">
									{countPermissions(unitPerms)}
								</Badge>
							)}
						</div>
					</AccordionTrigger>
					<AccordionContent className="pt-0 pb-4 px-1">
						<p className="text-sm text-muted-foreground mb-3">
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
					</AccordionContent>
				</AccordionItem>
			</Accordion>

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
