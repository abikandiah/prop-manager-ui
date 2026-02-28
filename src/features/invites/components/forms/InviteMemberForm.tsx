import { useCallback } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
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
import { useInviteMember } from '@/features/memberships'
import { AssignmentConfigurator } from '@/features/policy-assignments/components/AssignmentConfigurator'
import {
	type AssignmentConfigValue,
	ResourceType,
} from '@/domain/policy-assignment'

// ---------- Schema ----------

const assignmentConfigSchema = z.object({
	resourceType: z.nativeEnum(ResourceType),
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
	index: number,
): string {
	if (config.resourceType === ResourceType.ORG) return 'Organization'
	return `Assignment ${index + 1}`
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
		mode: 'onTouched',
	})

	const { fields, append, remove } = useFieldArray({
		control,
		name: 'assignments',
	})

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

			{/* Assignments */}
			<div className="space-y-3">
				{fields.length > 0 && (
					<>
						<Label>Permission assignments</Label>
						<Accordion type="multiple" className="w-full space-y-2">
							{fields.map((field, index) => {
								const configValue = watch(`assignments.${index}`)
								return (
									<AccordionItem
										key={field.id}
										value={field.id}
										className="border rounded-md bg-background px-2"
									>
										<AccordionTrigger className="hover:no-underline py-2">
											<div className="flex flex-1 items-center justify-between mr-4">
												<span className="font-medium text-sm">
													{deriveAssignmentLabel(configValue, index)}
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
														<span className="sr-only">Remove assignment</span>
													</Button>
												</div>
											</div>
										</AccordionTrigger>
										<AccordionContent className="pt-0 pb-4 px-2">
											<AssignmentConfigurator
												orgId={orgId}
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
					onClick={() =>
						append({
							resourceType: ResourceType.PROPERTY,
							resourceId: '',
							usePolicy: true,
							policyId: undefined,
							overrides: {},
						})
					}
				>
					<Plus className="mr-2 h-4 w-4" />
					Add assignment
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
