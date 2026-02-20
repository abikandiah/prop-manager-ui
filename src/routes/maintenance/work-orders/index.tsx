import { createFileRoute } from '@tanstack/react-router'
import { BannerHeader } from '@abumble/design-system/components/BannerHeader'

export const Route = createFileRoute('/maintenance/work-orders/')({
	component: WorkOrdersPage,
})

function WorkOrdersPage() {
	return (
		<div className="space-y-6">
			<BannerHeader
				title="Work Orders"
				description="Create and track work orders for maintenance jobs across your properties."
			/>
		</div>
	)
}
