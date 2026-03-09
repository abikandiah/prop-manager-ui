import {
	FieldError,
	FormFooter,
	ProfileField,
	SectionCard,
} from '@/components/ui'
import type { User } from '@/domain/user'
import { useAuth, useUpdateMe } from '@/features/auth/hooks'
import { FORM_DIALOG_CLASS } from '@/lib/dialog'
import { formatPhoneNumber, validatePhoneNumber } from '@/lib/phone'
import { Button } from '@abumble/design-system/components/Button'
import { FormDialog } from '@abumble/design-system/components/Dialog'
import { Input } from '@abumble/design-system/components/Input'
import { Label } from '@abumble/design-system/components/Label'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

const profileSchema = z.object({
	name: z.string().min(1, 'Name is required').max(255),
	phoneNumber: z
		.string()
		.max(50)
		.optional()
		.refine((val) => validatePhoneNumber(val), {
			message: 'Please enter a valid phone number (e.g. +1 555-555-5555)',
		}),
})

type ProfileFormValues = z.infer<typeof profileSchema>

function UserProfileEditForm({
	user,
	onClose,
}: {
	user: User
	onClose: () => void
}) {
	const updateMe = useUpdateMe()
	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<ProfileFormValues>({
		resolver: standardSchemaResolver(profileSchema),
		defaultValues: {
			name: user.name,
			phoneNumber: user.phoneNumber ?? '',
		},
	})

	function onSubmit(values: ProfileFormValues) {
		updateMe.mutate(
			{
				name: values.name,
				phoneNumber: formatPhoneNumber(values.phoneNumber) || null,
			},
			{
				onSuccess: () => {
					toast.success('Profile updated')
					onClose()
				},
			},
		)
	}

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
			<div className="space-y-1.5">
				<Label htmlFor="name">Name</Label>
				<Input id="name" {...register('name')} />
				<FieldError message={errors.name?.message} />
			</div>
			<div className="space-y-1.5">
				<Label htmlFor="phoneNumber">Phone number</Label>
				<Input id="phoneNumber" type="tel" {...register('phoneNumber')} />
				<FieldError message={errors.phoneNumber?.message} />
			</div>
			<FormFooter
				pending={isSubmitting || updateMe.isPending}
				onCancel={onClose}
				submitLabel="Save"
			/>
		</form>
	)
}

export function UserProfileSection() {
	const { user } = useAuth()
	const [editing, setEditing] = useState(false)
	if (!user) return null

	return (
		<>
			<SectionCard
				title="Your account"
				actions={
					<Button variant="outline" size="sm" onClick={() => setEditing(true)}>
						Edit
					</Button>
				}
				contentClassName="grid grid-cols-1 sm:grid-cols-2 gap-4"
			>
				<ProfileField label="Name" value={user.name} />
				<ProfileField label="Email" value={user.email} />
				<ProfileField label="Phone number" value={user.phoneNumber} />
			</SectionCard>
			<FormDialog
				open={editing}
				onOpenChange={setEditing}
				title="Edit profile"
				description="Update your name and phone number."
				className={FORM_DIALOG_CLASS}
			>
				<UserProfileEditForm user={user} onClose={() => setEditing(false)} />
			</FormDialog>
		</>
	)
}
