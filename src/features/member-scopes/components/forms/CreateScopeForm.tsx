import { useCallback, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { z } from 'zod'
import { toast } from 'sonner'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@abumble/design-system/components/Button'
import { DialogFooter } from '@abumble/design-system/components/Dialog'
import { Input } from '@abumble/design-system/components/Input'
import { Label } from '@abumble/design-system/components/Label'
import { Select } from '@abumble/design-system/components/Select'
import { FieldError } from '@/components/ui/FieldError'
import { RequiredMark } from '@/components/ui'
import {
	PermissionMatrixEditor,
	PermissionTemplateSelect,
} from '@/features/permission-templates'
import { usePermissionTemplates } from '@/features/permission-templates/hooks'
import { useCreateMemberScope } from '../../hooks'
import type { ScopeType } from '@/domain/member-scope'

// ---------- Schema ----------

const createScopeSchema = z
	.object({
		scopeType: z.enum(['ORG', 'PROPERTY', 'UNIT']),
		scopeId: z.string(),
		useTemplate: z.boolean(),
		templateId: z.string(),
		permissions: z.record(z.string(), z.string()),
	})
	.refine(
		(data) => data.scopeType === 'ORG' || data.scopeId.trim().length > 0,
		{
			message: 'Scope ID is required for PROPERTY and UNIT scopes',
			path: ['scopeId'],
		},
	)
	.refine((data) => !data.useTemplate || data.templateId.trim().length > 0, {
		message: 'Select a template',
		path: ['templateId'],
	})
	.refine(
		(data) =>
			data.useTemplate ||
			Object.values(data.permissions).some((v) => v.trim() !== ''),
		{
			message: 'Grant at least one permission',
			path: ['permissions'],
		},
	)

type CreateScopeFormValues = z.infer<typeof createScopeSchema>

// ---------- Props ----------

export interface CreateScopeFormProps {
	/** The org the membership belongs to. */
	orgId: string
	/** The membership to add the scope to. */
	membershipId: string
	onSuccess?: () => void
	onCancel?: () => void
}

// ---------- Component ----------

export function CreateScopeForm({
	orgId,
	membershipId,
	onSuccess,
	onCancel,
}: CreateScopeFormProps) {
	const createScope = useCreateMemberScope()
	const { data: templates } = usePermissionTemplates(orgId)
	const [advancedOpen, setAdvancedOpen] = useState(false)

	const {
		register,
		control,
		watch,
		handleSubmit,
		setValue,
		formState: { errors },
	} = useForm<CreateScopeFormValues>({
		resolver: standardSchemaResolver(createScopeSchema),
		defaultValues: {
			scopeType: 'ORG',
			scopeId: '',
			useTemplate: true,
			templateId: '',
			permissions: {},
		},
		mode: 'onTouched',
	})

	const scopeType = watch('scopeType')
	const useTemplate = watch('useTemplate')
	const templateId = watch('templateId')

	// Preview permissions for the selected template at the current scope level
	const selectedTemplate = templates?.find((t) => t.id === templateId)
	const previewPermissions =
		selectedTemplate?.items.find((item) => item.scopeType === scopeType)
			?.permissions ?? {}

	const handleToggleAdvanced = () => {
		const next = !advancedOpen
		setAdvancedOpen(next)
		setValue('useTemplate', !next)
		if (!next) {
			// Switching back to template mode — clear manual permissions
			setValue('permissions', {})
		} else {
			// Switching to manual mode — clear template selection
			setValue('templateId', '')
		}
	}

	const onSubmit = useCallback(
		(values: CreateScopeFormValues) => {
			const resolvedScopeId =
				values.scopeType === 'ORG' ? orgId : values.scopeId.trim()

			createScope.mutate(
				{
					orgId,
					membershipId,
					payload: {
						scopeType: values.scopeType as ScopeType,
						scopeId: resolvedScopeId,
						// In template mode the binding row alone activates the template;
						// in manual mode supply explicit permissions.
						permissions: values.useTemplate ? {} : values.permissions,
					},
				},
				{
					onSuccess: () => {
						toast.success('Scope added')
						onSuccess?.()
					},
				},
			)
		},
		[orgId, membershipId, createScope, onSuccess],
	)

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-4">
			{/* Scope type */}
			<div className="space-y-2">
				<Label htmlFor="scopeType">
					Scope level <RequiredMark />
				</Label>
				<Select id="scopeType" {...register('scopeType')}>
					<option value="ORG">Organization — org-wide access</option>
					<option value="PROPERTY">Property — access to one property</option>
					<option value="UNIT">Unit — access to one unit</option>
				</Select>
				<FieldError message={errors.scopeType?.message} />
			</div>

			{/* Scope ID — only for PROPERTY and UNIT */}
			{scopeType !== 'ORG' && (
				<div className="space-y-2">
					<Label htmlFor="scopeId">
						{scopeType === 'PROPERTY' ? 'Property ID' : 'Unit ID'}{' '}
						<RequiredMark />
					</Label>
					<Input
						id="scopeId"
						{...register('scopeId')}
						placeholder="Paste the UUID of the property or unit"
					/>
					<FieldError message={errors.scopeId?.message} />
				</div>
			)}

			{/* Template selector (template mode) */}
			{!advancedOpen && (
				<div className="space-y-2">
					<Label htmlFor="templateId">
						Permission template <RequiredMark />
					</Label>
					<Controller
						name="templateId"
						control={control}
						render={({ field }) => (
							<PermissionTemplateSelect
								id="templateId"
								orgId={orgId}
								value={field.value}
								onChange={field.onChange}
							/>
						)}
					/>
					<FieldError message={errors.templateId?.message} />

					{/* Read-only preview of selected template's permissions */}
					{selectedTemplate && (
						<div className="space-y-1 pt-1">
							<p className="text-xs text-muted-foreground">
								Preview of permissions granted by this template:
							</p>
							<PermissionMatrixEditor value={previewPermissions} readOnly />
						</div>
					)}
				</div>
			)}

			{/* Manual permissions editor (advanced mode) */}
			{advancedOpen && (
				<div className="space-y-2">
					<Label>Permissions</Label>
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
					<FieldError message={errors.permissions?.message} />
				</div>
			)}

			{/* Toggle between template and manual mode */}
			<button
				type="button"
				className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
				onClick={handleToggleAdvanced}
			>
				{advancedOpen ? (
					<>
						<ChevronUp className="h-4 w-4" />
						Use a template instead
					</>
				) : (
					<>
						<ChevronDown className="h-4 w-4" />
						Set permissions manually
					</>
				)}
			</button>

			<DialogFooter className="gap-2">
				{onCancel && (
					<Button type="button" variant="outline" onClick={onCancel}>
						Cancel
					</Button>
				)}
				<Button type="submit" disabled={createScope.isPending}>
					{createScope.isPending ? (
						'Saving…'
					) : (
						<>
							<Check className="h-4 w-4" />
							Add scope
						</>
					)}
				</Button>
			</DialogFooter>
		</form>
	)
}
