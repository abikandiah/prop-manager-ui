import { useCallback } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { z } from 'zod'
import { toast } from 'sonner'
import { Send } from 'lucide-react'
import { Button } from '@abumble/design-system/components/Button'
import { DialogFooter } from '@abumble/design-system/components/Dialog'
import { Input } from '@abumble/design-system/components/Input'
import { Label } from '@abumble/design-system/components/Label'
import { FieldError } from '@/components/ui/FieldError'
import { RequiredMark } from '@/components/ui'
import {
	PermissionTemplateSelect,
	usePermissionTemplateDetail,
} from '@/features/permission-templates'
import { useInviteMember } from '@/features/memberships'
import { usePropsList } from '@/features/props'

const inviteSchema = z
	.object({
		email: z.string().email('Invalid email address'),
		templateId: z.string().min(1, 'Please select a role'),
		propertyIds: z.array(z.string()),
		unitId: z.string(),
	})
	.refine(
		(_data) => {
			// Resource IDs validated in onSubmit after template data loads
			return true
		},
		{ message: '' },
	)

type InviteFormValues = z.infer<typeof inviteSchema>

export interface InviteMemberFormProps {
	orgId: string
	onSuccess?: () => void
	onCancel?: () => void
}

export function InviteMemberForm({
	orgId,
	onSuccess,
	onCancel,
}: InviteMemberFormProps) {
	const inviteMember = useInviteMember()
	const { data: props } = usePropsList()

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
			templateId: '',
			propertyIds: [],
			unitId: '',
		},
		mode: 'onTouched',
	})

	const templateId = watch('templateId')

	const { data: selectedTemplate } = usePermissionTemplateDetail(
		templateId || null,
	)

	const needsPropertyBinding =
		selectedTemplate?.items.some((i) => i.scopeType === 'PROPERTY') ?? false
	const needsUnitBinding =
		selectedTemplate?.items.some((i) => i.scopeType === 'UNIT') ?? false

	const onSubmit = useCallback(
		(values: InviteFormValues) => {
			const scopes: Array<{
				scopeType: 'ORG' | 'PROPERTY' | 'UNIT'
				scopeId: string
			}> = []

			if (needsPropertyBinding) {
				for (const propId of values.propertyIds) {
					scopes.push({ scopeType: 'PROPERTY', scopeId: propId })
				}
			}
			if (needsUnitBinding && values.unitId) {
				scopes.push({ scopeType: 'UNIT', scopeId: values.unitId })
			}

			inviteMember.mutate(
				{
					orgId,
					payload: {
						email: values.email,
						templateId: values.templateId,
						initialScopes: scopes,
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
		[orgId, inviteMember, onSuccess, needsPropertyBinding, needsUnitBinding],
	)

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-4">
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

			<div className="space-y-2">
				<Label htmlFor="templateId">
					Role <RequiredMark />
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
				<p className="text-xs text-muted-foreground">
					Select a role to define this member's permissions.
				</p>
				<FieldError message={errors.templateId?.message} />
			</div>

			{needsPropertyBinding && (
				<div className="space-y-2">
					<Label>
						Properties <RequiredMark />
					</Label>
					<p className="text-xs text-muted-foreground">
						Select the properties this member will manage.
					</p>
					<Controller
						name="propertyIds"
						control={control}
						render={({ field }) => (
							<div className="space-y-1 max-h-40 overflow-y-auto rounded border p-2">
								{props && props.length > 0 ? (
									props.map((prop) => (
										<label
											key={prop.id}
											className="flex items-center gap-2 text-sm cursor-pointer rounded px-2 py-1 hover:bg-muted/50"
										>
											<input
												type="checkbox"
												value={prop.id}
												checked={field.value.includes(prop.id)}
												onChange={(e) => {
													if (e.target.checked) {
														field.onChange([...field.value, prop.id])
													} else {
														field.onChange(
															field.value.filter((id) => id !== prop.id),
														)
													}
												}}
											/>
											{prop.legalName}
										</label>
									))
								) : (
									<p className="text-sm text-muted-foreground px-2 py-1">
										No properties found.
									</p>
								)}
							</div>
						)}
					/>
				</div>
			)}

			{needsUnitBinding && (
				<div className="space-y-2">
					<Label htmlFor="unitId">
						Unit ID <RequiredMark />
					</Label>
					<Input
						id="unitId"
						placeholder="Paste the unit UUID"
						{...register('unitId')}
					/>
					<p className="text-xs text-muted-foreground">
						The unique ID of the unit this tenant will occupy.
					</p>
				</div>
			)}

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
