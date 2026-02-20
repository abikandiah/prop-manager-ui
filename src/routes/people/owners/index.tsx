import { createFileRoute } from '@tanstack/react-router'
import { BannerHeader } from '@abumble/design-system/components/BannerHeader'

export const Route = createFileRoute('/people/owners/')({
	component: OwnersPage,
})

function OwnersPage() {
	return (
		<div className="space-y-6">
			<BannerHeader
				title="Owners"
				description="Manage the property owners you work with — individuals or companies."
			/>
		</div>
	)
}
