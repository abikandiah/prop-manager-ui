import { AppRole } from '@/domain/user'
import { useActiveOrgRoles } from '@/features/auth'
import { BannerHeader } from '@abumble/design-system/components/BannerHeader'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/_org/_dashboard/maintenance/')({
	component: MaintenancePage,
})

function MaintenancePage() {
	const activeOrgRoles = useActiveOrgRoles()
	const isManagerOrAdmin = activeOrgRoles.some(
		(r) => r === AppRole.MANAGER || r === AppRole.ADMIN,
	)
	const isTenant = activeOrgRoles.includes(AppRole.TENANT)

	return (
		<div className="flex flex-col gap-8">
			<BannerHeader
				title="Maintenance"
				description="View and manage maintenance requests across your properties and units."
			/>
			{isManagerOrAdmin && <ManagerMaintenanceSection />}
			{isTenant && <TenantMaintenanceSection />}
		</div>
	)
}

function ManagerMaintenanceSection() {
	return (
		<div className="space-y-4">
			<h2 className="text-lg font-semibold">Portfolio</h2>
			<p className="text-muted-foreground text-sm">
				Manage maintenance requests and work orders submitted across all your
				properties.
			</p>
		</div>
	)
}

function TenantMaintenanceSection() {
	return (
		<div className="space-y-4">
			<h2 className="text-lg font-semibold">My Unit</h2>
			<p className="text-muted-foreground text-sm">
				Submit and track maintenance requests for your unit.
			</p>
		</div>
	)
}
