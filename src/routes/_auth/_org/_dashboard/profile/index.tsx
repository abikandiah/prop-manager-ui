import { useAuth, useActiveOrgRoles } from '@/features/auth/hooks'
import { useMyTenantProfile } from '@/features/tenant-portal'
import { TenantProfileSection } from '@/features/tenant-portal/components/TenantProfileSection'
import { AppRole } from '@/domain/user'
import { BannerHeader } from '@abumble/design-system/components/BannerHeader'
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '@abumble/design-system/components/Card'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/_org/_dashboard/profile/')({
	component: ProfilePage,
})

function UserProfileSection() {
	const { user } = useAuth()
	if (!user) return null

	return (
		<Card>
			<CardHeader className="px-5 pb-3">
				<CardTitle className="text-base">Your account</CardTitle>
			</CardHeader>
			<CardContent className="px-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div className="flex flex-col gap-0.5">
					<span className="text-xs text-muted-foreground">Name</span>
					<span className="text-sm text-foreground">{user.name}</span>
				</div>
				<div className="flex flex-col gap-0.5">
					<span className="text-xs text-muted-foreground">Email</span>
					<span className="text-sm text-foreground">{user.email}</span>
				</div>
			</CardContent>
		</Card>
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
