import { createFileRoute } from '@tanstack/react-router'
import { BannerHeader } from '@abumble/design-system/components/BannerHeader'

export const Route = createFileRoute('/finance/transactions/')({
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
