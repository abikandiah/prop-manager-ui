import { AppSidebar } from '@/components/AppSidebar'
import { DashboardPage } from '@/components/ui/pages'
import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/_org/_dashboard')({
	component: RouteComponent,
})

function RouteComponent() {
	return (
		<DashboardPage Sidebar={AppSidebar}>
			<Outlet />
		</DashboardPage>
	)
}
