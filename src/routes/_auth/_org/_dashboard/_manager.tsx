import { AppRole } from '@/domain/user'
import { authQueryOptions } from '@/features/auth'
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/_org/_dashboard/_manager')({
	beforeLoad: ({ context }) => {
		const user = context.globalClient.getQueryData(authQueryOptions.queryKey)
		const isManagerOrAdmin =
			user?.roles.includes(AppRole.MANAGER) ||
			user?.roles.includes(AppRole.ADMIN)
		if (!isManagerOrAdmin) throw redirect({ to: '/home' })
	},
	component: () => <Outlet />,
})
