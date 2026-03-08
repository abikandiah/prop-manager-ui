import { ManagerDashboardSection } from '@/components/ManagerDashboardSection'
import { TenantDashboardSection } from '@/components/TenantDashboardSection'
import { AppRole } from '@/domain/user'
import { useActiveOrgRoles } from '@/features/auth'
import { useOrganization } from '@/contexts/organization'
import { BannerHeader } from '@abumble/design-system/components/BannerHeader'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/_org/_dashboard/home')({
	component: DashboardHome,
})

function DashboardHome() {
	const activeOrgRoles = useActiveOrgRoles()
	const { activeOrg } = useOrganization()
	const isManagerOrAdmin = activeOrgRoles.some(
		(r) => r === AppRole.MANAGER || r === AppRole.ADMIN,
	)
	const isTenant = activeOrgRoles.includes(AppRole.TENANT)
	const hasNoRoles = !isManagerOrAdmin && !isTenant

	return (
		<div className="flex flex-col gap-8">
			<BannerHeader
				title="Dashboard"
				description="Your home base. Jump to your properties, leases, messages, or tenancy info—everything in one place."
			/>
			{isManagerOrAdmin && <ManagerDashboardSection />}
			{isTenant && <TenantDashboardSection />}
			{hasNoRoles && (
				<div className="rounded-lg border border-dashed p-10 text-center">
					<p className="text-muted-foreground">
						Welcome to <strong>{activeOrg?.name ?? 'your organization'}</strong>
						. Your access is being set up — contact your administrator to get
						started.
					</p>
				</div>
			)}
		</div>
	)
}
