import { BannerHeader } from '@abumble/design-system/components/BannerHeader'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/_org/_dashboard/_tenant/my-lease/')({
	component: RouteComponent,
})

function RouteComponent() {
	return (
		<BannerHeader
			title="My Lease"
			description="View your current lease agreement, terms, and important dates."
		/>
	)
}
