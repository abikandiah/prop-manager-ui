import { createFileRoute } from '@tanstack/react-router'
import { BannerHeader } from '@abumble/design-system/components/BannerHeader'

export const Route = createFileRoute('/maintenance/requests/')({
	component: MaintenanceRequestsPage,
})

function MaintenanceRequestsPage() {
	return (
		<div className="space-y-6">
			<BannerHeader
				title="Maintenance Requests"
				description="View and manage repair and maintenance requests submitted by your tenants."
			/>
		</div>
	)
}
