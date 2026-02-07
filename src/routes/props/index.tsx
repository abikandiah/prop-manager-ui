import { createFileRoute } from '@tanstack/react-router'
import { PropsForm, PropsTableView } from '@/features/props/components'
import { PageDescription, PageHeader } from '@/components/ui'

export const Route = createFileRoute('/props/')({
	component: RouteComponent,
})

function RouteComponent() {
	return (
		<div className="flex flex-col gap-8">
			{/* Header Banner */}
			<div className="relative -mx-4 -mt-4 overflow-hidden border-b bg-card md:-mx-6 md:-mt-6">
				<div className="image-background absolute inset-0 opacity-10" />
				<div className="relative px-4 py-8 md:px-6 md:py-12">
					<div className="space-y-1.5">
						<PageHeader>Properties</PageHeader>
						<PageDescription>
							Manage and monitor your properties, units, and tenants from one
							central dashboard.
						</PageDescription>
					</div>
				</div>
			</div>

			<div>
				<PropsForm />
			</div>

			<PropsTableView />
		</div>
	)
}
