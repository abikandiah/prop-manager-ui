import { ManagerDashboardSection } from '@/components/ManagerDashboardSection'
import { TenantDashboardSection } from '@/components/TenantDashboardSection'
import { AppRole } from '@/domain/user'
import { useAuth } from '@/features/auth'
import { BannerHeader } from '@abumble/design-system/components/BannerHeader'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/_org/_dashboard/home')({
	component: DashboardHome,
})

function DashboardHome() {
	const { user } = useAuth()
	const isManagerOrAdmin = user?.roles.some(
		(r) => r === AppRole.MANAGER || r === AppRole.ADMIN,
	)
	const isTenant = user?.roles.includes(AppRole.TENANT)

	return (
		<div className="flex flex-col gap-8">
			<BannerHeader
				title="Dashboard"
				description="Your home base. Jump to your properties, leases, messages, or tenancy info—everything in one place."
			/>
			{isManagerOrAdmin && <ManagerDashboardSection />}
			{isTenant && <TenantDashboardSection />}
		</div>
	)
}
