import { AppRole } from '@/domain/user'
import { authQueryOptions } from '@/features/auth'
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/_org/_dashboard/_tenant')({
	beforeLoad: async ({ context }) => {
		const user = await context.globalClient.ensureQueryData(authQueryOptions)
		const orgId = user?.organizations[0]?.id
		const orgRoles = user?.organizations.find((o) => o.id === orgId)?.roles ?? []
		if (!orgRoles.includes(AppRole.TENANT)) throw redirect({ to: '/home' })
	},
	component: () => <Outlet />,
})
