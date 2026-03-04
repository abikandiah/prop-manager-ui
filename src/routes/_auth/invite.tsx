import Footer from '@/components/Footer'
import Header from '@/components/Header'
import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/invite')({
	component: RouteComponent,
})

function RouteComponent() {
	return (
		<>
			<Header />
			<Outlet />
			<Footer />
		</>
	)
}
