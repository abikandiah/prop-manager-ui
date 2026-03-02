import { useCallback, useEffect, useRef, useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { z } from 'zod'
import { toast } from 'sonner'
import { Send, Plus, Trash2, ChevronDown } from 'lucide-react'
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
import { useInviteMember } from '@/features/memberships'
import { usePropsList } from '@/features/props'
import { useUnitsList } from '@/features/units'
import { usePermissionPolicies } from '@/features/permission-policies/hooks'
import { AssignmentConfigurator } from '@/features/policy-assignments/components/AssignmentConfigurator'
import {
	type AssignmentConfigValue,
	ResourceType,
} from '@/domain/policy-assignment'
import type { Prop } from '@/domain/property'
import type { Unit } from '@/domain/unit'
import type { PermissionPolicy } from '@/domain/permission-policy'

// ---------- Schema ----------

const assignmentConfigSchema = z.object({
	resourceType: z.enum(ResourceType),
	resourceId: z.string(),
	usePolicy: z.boolean(),
	policyId: z.string().optional(),
	overrides: z.record(z.string(), z.string()),
})

const inviteSchema = z.object({
	email: z.string().email('Invalid email address'),
	assignments: z.array(assignmentConfigSchema),
})

type InviteFormValues = z.infer<typeof inviteSchema>

// ---------- Helpers ----------

function deriveAssignmentLabel(
	config: AssignmentConfigValue,
	props: Prop[] | undefined,
	units: Unit[] | undefined,
	policies: PermissionPolicy[] | undefined,
): string {
	const permLabel = config.usePolicy
		? (policies?.find((p) => p.id === config.policyId)?.name ?? 'No policy')
		: 'Custom'

	if (config.resourceType === ResourceType.ORG) {
		return `Organization  •  ${permLabel}`
	}
	if (config.resourceType === ResourceType.PROPERTY) {
		const name =
			props?.find((p) => p.id === config.resourceId)?.legalName ??
			'Select a property'
		return `${name}  •  ${permLabel}`
	}
	if (config.resourceType === ResourceType.UNIT) {
		const unit = units?.find((u) => u.id === config.resourceId)
		const label = unit ? `Unit ${unit.unitNumber}` : 'Select a unit'
		return `${label}  •  ${permLabel}`
	}
	return 'Assignment'
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

	// Data for summary labels — all cached from AssignmentConfigurator's own fetches
	const { data: props } = usePropsList()
	const { data: units } = useUnitsList()
	const { data: policies } = usePermissionPolicies(orgId)

	// Controlled single-expand accordion
	const [expandedId, setExpandedId] = useState<string | null>(null)
	const justAddedRef = useRef(false)

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
			assignments: [],
		},
		mode: 'onSubmit',
		reValidateMode: 'onChange',
	})

	const { fields, append, remove } = useFieldArray({
		control,
		name: 'assignments',
	})

	// Auto-expand the newly appended assignment
	useEffect(() => {
		if (justAddedRef.current && fields.length > 0) {
			justAddedRef.current = false
			setExpandedId(fields[fields.length - 1].id)
		}
	}, [fields.length, fields])

	const handleAddAssignment = () => {
		justAddedRef.current = true
		append({
			resourceType: ResourceType.PROPERTY,
			resourceId: '',
			usePolicy: true,
			policyId: undefined,
			overrides: {},
		})
	}

	const onSubmit = useCallback(
		(values: InviteFormValues) => {
			const assignments = values.assignments
				.map((config) => {
					const resourceId =
						config.resourceType === ResourceType.ORG
							? orgId
							: config.resourceId.trim()
					return {
						resourceType: config.resourceType,
						resourceId,
						policyId: config.usePolicy ? config.policyId : null,
						overrides: !config.usePolicy ? config.overrides : null,
					}
				})
				.filter(
					(a) =>
						a.resourceId &&
						(a.policyId ||
							(a.overrides &&
								Object.values(a.overrides).some((v) => v.trim() !== ''))),
				)

			inviteMember.mutate(
				{
					orgId,
					payload: {
						email: values.email,
						assignments: assignments.length > 0 ? assignments : undefined,
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
		[orgId, inviteMember, onSuccess],
	)

	return (
		<form onSubmit={handleSubmit(onSubmit)}>
			<div className="space-y-5 py-4 overflow-y-auto max-h-[55vh]">
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

				{/* Assignments */}
				<div className="space-y-3">
					{fields.length > 0 && (
						<>
							<Label>Permission assignments</Label>
							<Accordion
								type="single"
								collapsible
								value={expandedId ?? ''}
								onValueChange={(val) => setExpandedId(val || null)}
								className="w-full space-y-2"
							>
								{fields.map((field, index) => {
									const configValue = watch(`assignments.${index}`)
									const summaryLabel = deriveAssignmentLabel(
										configValue,
										props,
										units,
										policies,
									)

									return (
										<AccordionItem
											key={field.id}
											value={field.id}
											className="border rounded bg-background px-2"
										>
											<AccordionTrigger
												hideChevron
												className="hover:no-underline py-2 gap-1.5 items-center"
											>
												<ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
												<span className="truncate flex-1 text-left">
													{summaryLabel}
												</span>
												<div onClick={(e) => e.stopPropagation()}>
													<Button
														type="button"
														variant="ghost"
														size="icon"
														className="h-8 w-8 text-destructive hover:text-destructive shrink-0"
														onClick={() => {
															remove(index)
															setExpandedId((prev) =>
																prev === field.id ? null : prev,
															)
														}}
													>
														<Trash2 className="h-4 w-4" />
														<span className="sr-only">Remove assignment</span>
													</Button>
												</div>
											</AccordionTrigger>
											<AccordionContent className="pt-0 pb-4 px-2">
												<AssignmentConfigurator
													orgId={orgId}
													groupId={field.id}
													value={{
														resourceType:
															configValue.resourceType as ResourceType,
														resourceId: configValue.resourceId,
														usePolicy: configValue.usePolicy,
														policyId: configValue.policyId,
														overrides: configValue.overrides,
													}}
													onChange={(next) => {
														setValue(
															`assignments.${index}.resourceType`,
															next.resourceType,
														)
														setValue(
															`assignments.${index}.resourceId`,
															next.resourceId,
														)
														setValue(
															`assignments.${index}.usePolicy`,
															next.usePolicy,
														)
														setValue(
															`assignments.${index}.policyId`,
															next.policyId,
														)
														setValue(
															`assignments.${index}.overrides`,
															next.overrides,
														)
													}}
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
						onClick={handleAddAssignment}
					>
						<Plus className="mr-2 h-4 w-4" />
						Add assignment
					</Button>
				</div>
			</div>

			<DialogFooter className="pt-3 pb-1 gap-2">
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
