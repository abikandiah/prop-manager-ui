import { createFileRoute } from '@tanstack/react-router'
import { PropsForm, PropsTableView } from '@/features/props/components'
import { BannerHeader } from '@/components/ui'

export const Route = createFileRoute('/props/')({
	component: RouteComponent,
})

function RouteComponent() {
	return (
		<>
			<BannerHeader
				title="Properties"
				description={
					<>
						This is where you keep a list of every property you own or
						manage—your house, a rental building, a commercial space, or a piece
						of land. Add each one with its address and a few details; later you
						can attach units and tenants to them.
					</>
				}
				breadcrumbItems={[{ label: 'Properties' }]}
			/>

			<div>
				<PropsForm />
			</div>

			<PropsTableView />
		</>
	)
}
