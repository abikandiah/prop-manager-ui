import { BannerHeader } from '@abumble/design-system/components/BannerHeader'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
	'/_auth/_org/_dashboard/_tenant/maintenance/',
)({
	component: RouteComponent,
})

function RouteComponent() {
	return (
		<BannerHeader
			title="Maintenance"
			description="Submit maintenance requests and track their progress for your unit."
		/>
	)
}
