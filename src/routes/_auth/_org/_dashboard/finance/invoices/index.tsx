import { BannerHeader } from '@abumble/design-system/components/BannerHeader'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
	'/_auth/_org/_dashboard/finance/invoices/',
)({
	component: InvoicesPage,
})

function InvoicesPage() {
	return (
		<div className="space-y-6">
			<BannerHeader
				title="Invoices"
				description="Send and manage invoices for rent, fees, and services."
			/>
		</div>
	)
}
