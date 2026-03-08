import { useAuth, useActiveOrgRoles, useUpdateMe } from '@/features/auth/hooks'
import { useMyTenantProfile } from '@/features/tenant-portal'
import { TenantProfileSection } from '@/features/tenant-portal/components/TenantProfileSection'
import { AppRole } from '@/domain/user'
import { FieldError, FormFooter } from '@/components/ui'
import { BannerHeader } from '@abumble/design-system/components/BannerHeader'
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '@abumble/design-system/components/Card'
import { Button } from '@abumble/design-system/components/Button'
import {
	FormDialog,
} from '@abumble/design-system/components/Dialog'
import { Input } from '@abumble/design-system/components/Input'
import { Label } from '@abumble/design-system/components/Label'
import { createFileRoute } from '@tanstack/react-router'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { FORM_DIALOG_CLASS_WIDE } from '@/lib/dialog'
import type { User } from '@/domain/user'

export const Route = createFileRoute('/_auth/_org/_dashboard/profile/')({
	component: ProfilePage,
})

const profileSchema = z.object({
	name: z.string().min(1, 'Name is required').max(255),
	phoneNumber: z.string().max(50).optional(),
})

type ProfileFormValues = z.infer<typeof profileSchema>

function UserProfileEditForm({ user, onClose }: { user: User; onClose: () => void }) {
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
				phoneNumber: values.phoneNumber || null,
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
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

function ProfileField({ label, value }: { label: string; value: string | null | undefined }) {
	return (
		<div className="flex flex-col gap-0.5">
			<span className="text-xs text-muted-foreground">{label}</span>
			<span className="text-sm text-foreground">{value || '—'}</span>
		</div>
	)
}

function UserProfileSection() {
	const { user } = useAuth()
	const [editing, setEditing] = useState(false)
	if (!user) return null

	return (
		<>
			<Card>
				<CardHeader className="px-5 pb-3 flex flex-row items-center justify-between">
					<CardTitle className="text-base">Your account</CardTitle>
					<Button variant="outline" size="sm" onClick={() => setEditing(true)}>
						Edit
					</Button>
				</CardHeader>
				<CardContent className="px-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
					<ProfileField label="Name" value={user.name} />
					<ProfileField label="Email" value={user.email} />
					<ProfileField label="Phone number" value={user.phoneNumber} />
				</CardContent>
			</Card>
			<FormDialog
				open={editing}
				onOpenChange={setEditing}
				title="Edit profile"
				description="Update your name and phone number."
				className={FORM_DIALOG_CLASS_WIDE}
			>
				<UserProfileEditForm user={user} onClose={() => setEditing(false)} />
			</FormDialog>
		</>
	)
}

function TenantProfileSectionLoader() {
	const { data: tenant } = useMyTenantProfile()
	if (!tenant) return null
	return <TenantProfileSection tenant={tenant} />
}

function ProfilePage() {
	const activeOrgRoles = useActiveOrgRoles()
	const isTenant = activeOrgRoles.includes(AppRole.TENANT)

	return (
		<div className="flex flex-col gap-6">
			<BannerHeader
				title="Profile"
				description="Manage your account details."
			/>
			<UserProfileSection />
			{isTenant && <TenantProfileSectionLoader />}
		</div>
	)
}
