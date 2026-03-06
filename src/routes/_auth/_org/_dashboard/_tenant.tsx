import { AppRole } from '@/domain/user'
import { authQueryOptions } from '@/features/auth'
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/_org/_dashboard/_tenant')({
	beforeLoad: ({ context }) => {
		const user = context.globalClient.getQueryData(authQueryOptions.queryKey)
		if (!user?.roles.includes(AppRole.TENANT)) throw redirect({ to: '/home' })
	},
	component: () => <Outlet />,
})
