import { BannerHeader } from '@abumble/design-system/components/BannerHeader'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
	'/_auth/_org/_dashboard/_manager/finance/transactions/',
)({
	component: TransactionsPage,
})

function TransactionsPage() {
	return (
		<div className="space-y-6">
			<BannerHeader
				title="Transactions"
				description="A complete record of all income and expenses across your portfolio."
			/>
		</div>
	)
}
