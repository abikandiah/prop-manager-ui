import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/props/$id')({
	component: () => <Outlet />,
})
