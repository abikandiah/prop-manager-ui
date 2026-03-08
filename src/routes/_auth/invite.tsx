import { BannerLandingPage } from '@/components/ui/pages'
import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/invite')({
	component: RouteComponent,
})

function RouteComponent() {
	return (
		<BannerLandingPage>
			<Outlet />
		</BannerLandingPage>
	)
}
