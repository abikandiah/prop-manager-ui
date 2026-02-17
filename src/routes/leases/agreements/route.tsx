import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/leases/agreements')({
	component: () => <Outlet />,
})
