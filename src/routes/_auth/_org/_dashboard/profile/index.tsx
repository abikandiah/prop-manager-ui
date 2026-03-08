import { AppRole } from '@/domain/user'
import { useActiveOrgRoles, UserProfileSection } from '@/features/auth'
import { useMyTenantProfile } from '@/features/tenant-portal'
import { TenantProfileSection } from '@/features/tenant-portal/components/views/TenantProfileSection'
import { BannerHeader } from '@abumble/design-system/components/BannerHeader'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/_org/_dashboard/profile/')({
	component: ProfilePage,
})

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
