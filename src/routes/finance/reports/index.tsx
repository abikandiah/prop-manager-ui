import { createFileRoute } from '@tanstack/react-router'
import { BannerHeader } from '@abumble/design-system/components/BannerHeader'

export const Route = createFileRoute('/finance/reports/')({
	component: ReportsPage,
})

function ReportsPage() {
	return (
		<div className="space-y-6">
			<BannerHeader
				title="Reports"
				description="Summarized financial reports to help you understand how your portfolio is performing."
			/>
		</div>
	)
}
