import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_public')({
	component: RouteComponent,
})

function RouteComponent() {
	return (
		<div className="mt-24">
			<Outlet />
		</div>
	)
}
