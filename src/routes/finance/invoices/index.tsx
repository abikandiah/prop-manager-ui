import { createFileRoute } from '@tanstack/react-router'
import { BannerHeader } from '@abumble/design-system/components/BannerHeader'

export const Route = createFileRoute('/finance/invoices/')({
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
