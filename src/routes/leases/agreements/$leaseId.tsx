import { createFileRoute } from '@tanstack/react-router'
import { BannerHeader } from '@abumble/design-system/components/BannerHeader'

export const Route = createFileRoute('/leases/agreements/$leaseId')({
	component: LeaseDetailPage,
})

function LeaseDetailPage() {
	const { leaseId } = Route.useParams()

	return (
		<div>
			<BannerHeader
				title="Lease Details"
				description={`Viewing lease ${leaseId}`}
			/>
			<div className="text-muted-foreground">
				Lease detail page coming soon...
			</div>
		</div>
	)
}
