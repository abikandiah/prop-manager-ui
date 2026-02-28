import { useCallback } from 'react'
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
import { usePermissionTemplates } from '@/features/permission-templates'
import { useInviteMember } from '@/features/memberships'
import { usePropsList } from '@/features/props'
import { useUnitsList } from '@/features/units'
import { ScopeConfigurator } from '@/features/member-scopes/components/ScopeConfigurator'
import { scopeConfigSchema } from '@/features/member-scopes/schemas'
import { getTemplatePermissions } from '@/features/member-scopes/utils'
import type { ScopeConfigValue } from '@/domain/member-scope'
import type { Prop } from '@/domain/property'
import type { Unit } from '@/domain/unit'

// ---------- Schema ----------

const inviteSchema = z.object({
	email: z.string().email('Invalid email address'),
	scopes: z.array(scopeConfigSchema).min(1, 'Add at least one scope'),
})

type InviteFormValues = z.infer<typeof inviteSchema>

// ---------- Helpers ----------

function deriveScopeLabel(
	scope: ScopeConfigValue,
	index: number,
	props: Prop[] | undefined,
	units: Unit[] | undefined,
): string {
	if (scope.scopeType === 'ORG') return 'Organization'
	if (scope.scopeType === 'PROPERTY' && scope.scopeId) {
		return props?.find((p) => p.id === scope.scopeId)?.legalName ?? `Property (${index + 1})`
	}
	if (scope.scopeType === 'UNIT' && scope.scopeId) {
		return units?.find((u) => u.id === scope.scopeId)?.unitNumber ?? `Unit (${index + 1})`
	}
	return `Scope ${index + 1}`
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
	const { data: props } = usePropsList()
	const { data: units } = useUnitsList()
	const { data: allTemplates } = usePermissionTemplates(orgId)

	const {
		register,
		control,
		watch,
		handleSubmit,
		formState: { errors },
	} = useForm<InviteFormValues>({
		resolver: standardSchemaResolver(inviteSchema),
		defaultValues: {
			email: '',
			scopes: [
				{
					scopeType: 'ORG',
					scopeId: orgId,
					useTemplate: true,
					templateId: '',
					permissions: {},
				},
			],
		},
		mode: 'onTouched',
	})

	const { fields, append, remove } = useFieldArray({
		control,
		name: 'scopes',
	})

	const onSubmit = useCallback(
		(values: InviteFormValues) => {
			const orgScope = values.scopes.find((s) => s.scopeType === 'ORG')
			const membershipTemplateId =
				orgScope?.useTemplate && orgScope.templateId ? orgScope.templateId : undefined

			const initialScopes = values.scopes
				.filter((s) => !(s.scopeType === 'ORG' && s.useTemplate))
				.map((scope) => {
					const resolvedScopeId = scope.scopeType === 'ORG' ? orgId : scope.scopeId

					// Pure binding row: same template as the membership's primary
					if (scope.useTemplate && scope.templateId === membershipTemplateId) {
						return { scopeType: scope.scopeType, scopeId: resolvedScopeId }
					}

					// Flatten: different template or manual permissions
					let permissions = scope.permissions
					if (scope.useTemplate && scope.templateId) {
						const tmpl = allTemplates?.find((t) => t.id === scope.templateId)
						permissions = getTemplatePermissions(tmpl, scope.scopeType)
					}
					return { scopeType: scope.scopeType, scopeId: resolvedScopeId, permissions }
				})

			inviteMember.mutate(
				{
					orgId,
					payload: { email: values.email, templateId: membershipTemplateId, initialScopes },
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

			{/* Scope Builder */}
			<div className="space-y-3">
				<Label>Permissions</Label>
				<Accordion type="multiple" className="w-full space-y-2">
					{fields.map((field, index) => {
						const scopeValue = watch(`scopes.${index}`)
						return (
							<AccordionItem
								key={field.id}
								value={field.id}
								className="border rounded-md bg-background px-2"
							>
								<div className="flex items-center w-full">
									<AccordionTrigger className="flex-1 hover:no-underline py-2">
										<span className="font-medium text-sm">
											{deriveScopeLabel(scopeValue, index, props, units)}
										</span>
									</AccordionTrigger>
									{fields.length > 1 && (
										<Button
											type="button"
											variant="ghost"
											size="icon"
											className="h-8 w-8 text-destructive hover:text-destructive shrink-0 mr-2"
											onClick={() => remove(index)}
										>
											<Trash2 className="h-4 w-4" />
											<span className="sr-only">Remove scope</span>
										</Button>
									)}
								</div>
								<AccordionContent className="pt-0 pb-4 px-2">
									<Controller
										name={`scopes.${index}`}
										control={control}
										render={({ field: { value, onChange } }) => (
											<ScopeConfigurator
												orgId={orgId}
												value={value}
												onChange={onChange}
												errors={{
													scopeType: errors.scopes?.[index]?.scopeType,
													scopeId: errors.scopes?.[index]?.scopeId,
													templateId: errors.scopes?.[index]?.templateId,
													permissions: errors.scopes?.[index]?.permissions,
												}}
											/>
										)}
									/>
								</AccordionContent>
							</AccordionItem>
						)
					})}
				</Accordion>

				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() =>
						append({
							scopeType: 'PROPERTY',
							scopeId: '',
							useTemplate: true,
							templateId: '',
							permissions: {},
						})
					}
				>
					<Plus className="mr-2 h-4 w-4" />
					Add another scope
				</Button>
				<FieldError message={errors.scopes?.message ?? errors.scopes?.root?.message} />
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
