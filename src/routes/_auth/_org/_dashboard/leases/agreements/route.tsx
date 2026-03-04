import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
	'/_auth/_org/_dashboard/leases/agreements',
)({
	component: () => <Outlet />,
})
