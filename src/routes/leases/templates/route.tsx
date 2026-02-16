import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/leases/templates')({
	component: () => <Outlet />,
})
