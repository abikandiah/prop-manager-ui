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
import { PermissionTemplateSelect } from '@/features/permission-templates'
import { useInviteMember } from '@/features/memberships'

const inviteSchema = z.object({
	email: z.string().email('Invalid email address'),
	templateId: z.string().min(1, 'Please select a role'),
})

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

	const {
		register,
		control,
		handleSubmit,
		formState: { errors },
	} = useForm<InviteFormValues>({
		resolver: standardSchemaResolver(inviteSchema),
		defaultValues: {
			email: '',
			templateId: '',
		},
		mode: 'onTouched',
	})

	const onSubmit = useCallback(
		(values: InviteFormValues) => {
			inviteMember.mutate(
				{
					orgId,
					payload: {
						email: values.email,
						initialScopes: [
							{
								scopeType: 'ORG',
								scopeId: orgId,
								templateId: values.templateId,
							},
						],
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
					Select a role to define this member's initial permissions.
				</p>
				<FieldError message={errors.templateId?.message} />
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
