import { createFileRoute } from '@tanstack/react-router'
import { BannerHeader } from '@abumble/design-system/components/BannerHeader'

export const Route = createFileRoute('/_auth/_org/_dashboard/_manager/people/owners/')({
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
