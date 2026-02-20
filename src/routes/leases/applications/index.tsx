import { createFileRoute } from '@tanstack/react-router'
import { BannerHeader } from '@abumble/design-system/components/BannerHeader'

export const Route = createFileRoute('/leases/applications/')({
	component: LeaseApplicationsPage,
})

function LeaseApplicationsPage() {
	return (
		<div className="space-y-6">
			<BannerHeader
				title="Applications"
				description="Review and process rental applications from prospective tenants."
			/>
		</div>
	)
}
