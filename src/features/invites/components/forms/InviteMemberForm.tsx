import { useCallback, useMemo } from 'react'
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { z } from 'zod'
import { toast } from 'sonner'
import { Send, Plus, Trash2 } from 'lucide-react'
import { Button } from '@abumble/design-system/components/Button'
import { DialogFooter } from '@abumble/design-system/components/Dialog'
import { Input } from '@abumble/design-system/components/Input'
import { Label } from '@abumble/design-system/components/Label'
import {
	Accordion,
	AccordionItem,
	AccordionTrigger,
	AccordionContent,
} from '@/components/ui/accordion'
import { FieldError } from '@/components/ui/FieldError'
import { RequiredMark } from '@/components/ui'
import {
	PermissionTemplateSelect,
	usePermissionTemplates,
} from '@/features/permission-templates'
import { useInviteMember } from '@/features/memberships'
import { ScopeConfigurator } from '@/features/member-scopes/components/ScopeConfigurator'
import { TemplateScopeBindings } from '@/features/member-scopes/components/TemplateScopeBindings'
import { scopeConfigSchema } from '@/features/member-scopes/schemas'
import { getTemplatePermissions } from '@/features/member-scopes/utils'
import type { ScopeConfigValue, ScopeType } from '@/domain/member-scope'

// ---------- Schema ----------

const inviteSchema = z.object({
	email: z.string().email('Invalid email address'),
	templateId: z.string().optional(),
	propertyIds: z.array(z.string()),
	unitIds: z.array(z.string()),
	customScopes: z.array(scopeConfigSchema),
})

type InviteFormValues = z.infer<typeof inviteSchema>

// ---------- Helpers ----------

function deriveScopeLabel(scope: ScopeConfigValue, index: number): string {
	if (scope.scopeType === 'ORG') return 'Organization'
	return `Custom scope ${index + 1}`
}

function describeTemplateCoverage(scopeTypes: ScopeType[]): string {
	const nonOrg = scopeTypes.filter((t) => t !== 'ORG')
	if (nonOrg.length === 0) return 'Applies to the whole organization — no resource selection needed.'
	const labels = nonOrg.map((t) => (t === 'PROPERTY' ? 'properties' : 'units'))
	return `Select the ${labels.join(' and ')} this role should apply to.`
}

// ---------- Props ----------

export interface InviteMemberFormProps {
	orgId: string
	onSuccess?: () => void
	onCancel?: () => void
}

// ---------- Component ----------

export function InviteMemberForm({
	orgId,
	onSuccess,
	onCancel,
}: InviteMemberFormProps) {
	const inviteMember = useInviteMember()
	const { data: allTemplates } = usePermissionTemplates(orgId)

	const {
		register,
		control,
		watch,
		setValue,
		handleSubmit,
		formState: { errors },
	} = useForm<InviteFormValues>({
		resolver: standardSchemaResolver(inviteSchema),
		defaultValues: {
			email: '',
			templateId: '',
			propertyIds: [],
			unitIds: [],
			customScopes: [],
		},
		mode: 'onTouched',
	})

	const { fields, append, remove } = useFieldArray({
		control,
		name: 'customScopes',
	})

	const watchedTemplateId = watch('templateId')
	const watchedPropertyIds = watch('propertyIds')
	const watchedUnitIds = watch('unitIds')

	// Derive the selected template and which scope types it covers
	const selectedTemplate = useMemo(
		() => allTemplates?.find((t) => t.id === watchedTemplateId),
		[allTemplates, watchedTemplateId],
	)
	const templateScopeTypes: ScopeType[] = useMemo(
		() => selectedTemplate?.items.map((i) => i.scopeType) ?? [],
		[selectedTemplate],
	)

	const onSubmit = useCallback(
		(values: InviteFormValues) => {
			// Build initial scope rows from resource bindings (pure binding — no custom permissions)
			const bindingScopes = [
				...values.propertyIds.map((id) => ({
					scopeType: 'PROPERTY' as const,
					scopeId: id,
				})),
				...values.unitIds.map((id) => ({
					scopeType: 'UNIT' as const,
					scopeId: id,
				})),
			]

			// Resolve custom scopes — flatten template references into permissions
			const customScopeRows = values.customScopes.map((scope) => {
				const resolvedScopeId =
					scope.scopeType === 'ORG' ? orgId : scope.scopeId.trim()

				if (scope.useTemplate && scope.templateId) {
					const tmpl = allTemplates?.find((t) => t.id === scope.templateId)
					return {
						scopeType: scope.scopeType,
						scopeId: resolvedScopeId,
						permissions: getTemplatePermissions(tmpl, scope.scopeType),
					}
				}

				return {
					scopeType: scope.scopeType,
					scopeId: resolvedScopeId,
					permissions: scope.permissions,
				}
			})

			const initialScopes = [...bindingScopes, ...customScopeRows]

			inviteMember.mutate(
				{
					orgId,
					payload: {
						email: values.email,
						templateId: values.templateId || undefined,
						initialScopes: initialScopes.length > 0 ? initialScopes : undefined,
					},
				},
				{
					onSuccess: () => {
						toast.success('Invitation sent')
						onSuccess?.()
					},
				},
			)
		},
		[orgId, inviteMember, onSuccess, allTemplates],
	)

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-4">
			{/* Email */}
			<div className="space-y-2">
				<Label htmlFor="email">
					Email address <RequiredMark />
				</Label>
				<Input
					id="email"
					type="email"
					placeholder="colleague@example.com"
					{...register('email')}
				/>
				<FieldError message={errors.email?.message} />
			</div>

			{/* Role / Template */}
			<div className="space-y-2">
				<Label htmlFor="template-select">Role</Label>
				<Controller
					name="templateId"
					control={control}
					render={({ field }) => (
						<PermissionTemplateSelect
							id="template-select"
							orgId={orgId}
							value={field.value ?? ''}
							onChange={(id) => {
								field.onChange(id)
								// Clear resource bindings when the template changes
								setValue('propertyIds', [])
								setValue('unitIds', [])
							}}
						/>
					)}
				/>
				{selectedTemplate ? (
					<p className="text-xs text-muted-foreground">
						{describeTemplateCoverage(templateScopeTypes)}
					</p>
				) : allTemplates && (
					<p className="text-xs text-muted-foreground">
						No role selected — use custom scopes below to grant specific permissions.
					</p>
				)}
			</div>

			{/* Resource bindings — only shown when the template requires non-ORG scope types */}
			{selectedTemplate && templateScopeTypes.some((t) => t !== 'ORG') && (
				<TemplateScopeBindings
					templateScopeTypes={templateScopeTypes}
					propertyIds={watchedPropertyIds}
					unitIds={watchedUnitIds}
					onPropertyIdsChange={(ids) => setValue('propertyIds', ids)}
					onUnitIdsChange={(ids) => setValue('unitIds', ids)}
				/>
			)}

			{/* Custom scopes */}
			<div className="space-y-3">
				{fields.length > 0 && (
					<>
						<Label>Custom scopes</Label>
						<Accordion type="multiple" className="w-full space-y-2">
							{fields.map((field, index) => {
								const scopeValue = watch(`customScopes.${index}`)
								return (
									<AccordionItem
										key={field.id}
										value={field.id}
										className="border rounded-md bg-background px-2"
									>
										<AccordionTrigger className="hover:no-underline py-2">
											<div className="flex flex-1 items-center justify-between mr-4">
												<span className="font-medium text-sm">
													{deriveScopeLabel(scopeValue, index)}
												</span>
												<div onClick={(e) => e.stopPropagation()}>
													<Button
														type="button"
														variant="ghost"
														size="icon"
														className="h-8 w-8 text-destructive hover:text-destructive"
														onClick={() => remove(index)}
													>
														<Trash2 className="h-4 w-4" />
														<span className="sr-only">Remove scope</span>
													</Button>
												</div>
											</div>
										</AccordionTrigger>
										<AccordionContent className="pt-0 pb-4 px-2">
											<Controller
												name={`customScopes.${index}`}
												control={control}
												render={({ field: { value, onChange } }) => (
													<ScopeConfigurator
														orgId={orgId}
														value={value}
														onChange={onChange}
														hideTemplateMode
														errors={{
															scopeType: errors.customScopes?.[index]?.scopeType,
															scopeId: errors.customScopes?.[index]?.scopeId,
															permissions: errors.customScopes?.[index]?.permissions,
														}}
													/>
												)}
											/>
										</AccordionContent>
									</AccordionItem>
								)
							})}
						</Accordion>
					</>
				)}

				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() =>
						append({
							scopeType: 'PROPERTY',
							scopeId: '',
							useTemplate: false,
							permissions: {},
						})
					}
				>
					<Plus className="mr-2 h-4 w-4" />
					Add custom scope
				</Button>
			</div>

			<DialogFooter className="gap-2">
				{onCancel && (
					<Button type="button" variant="outline" onClick={onCancel}>
						Cancel
					</Button>
				)}
				<Button type="submit" disabled={inviteMember.isPending}>
					{inviteMember.isPending ? (
						'Sending…'
					) : (
						<>
							<Send className="h-4 w-4" />
							Send Invitation
						</>
					)}
				</Button>
			</DialogFooter>
		</form>
	)
}
