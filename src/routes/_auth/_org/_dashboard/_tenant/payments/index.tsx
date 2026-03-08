import { BannerHeader } from '@abumble/design-system/components/BannerHeader'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
	'/_auth/_org/_dashboard/_tenant/payments/',
)({
	component: RouteComponent,
})

function RouteComponent() {
	return (
		<BannerHeader
			title="Payments"
			description="See your payment history and make payments on your lease."
		/>
	)
}
