import { DashboardPage } from '@/components/pages'
import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/_org/_dashboard')({
	component: RouteComponent,
})

function RouteComponent() {
	return (
		<DashboardPage>
			<Outlet />
		</DashboardPage>
	)
}
