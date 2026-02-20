import { createFileRoute } from '@tanstack/react-router'
import { BannerHeader } from '@abumble/design-system/components/BannerHeader'

export const Route = createFileRoute('/people/vendors/')({
	component: VendorsPage,
})

function VendorsPage() {
	return (
		<div className="space-y-6">
			<BannerHeader
				title="Vendors"
				description="Track the contractors, tradespeople, and service providers you rely on."
			/>
		</div>
	)
}
