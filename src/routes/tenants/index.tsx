import { createFileRoute } from '@tanstack/react-router'
import { BannerHeader } from '@abumble/design-system/components/BannerHeader'
import { TenantsTableView } from '@/features/tenants'

export const Route = createFileRoute('/tenants/')({
	component: TenantsPage,
})

function TenantsPage() {
	return (
		<div className="space-y-6">
			<BannerHeader
				title="Tenants"
				description="Everyone who has a lease agreement with you — past and present."
			/>
			<TenantsTableView />
		</div>
	)
}
