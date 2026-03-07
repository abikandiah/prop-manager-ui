import { AppRole } from '@/domain/user'
import { authQueryOptions } from '@/features/auth'
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/_org/_dashboard/_manager')({
	beforeLoad: async ({ context }) => {
		const user = await context.globalClient.ensureQueryData(authQueryOptions)
		const orgId = user?.organizations[0]?.id
		const orgRoles = user?.organizations.find((o) => o.id === orgId)?.roles ?? []
		const isManagerOrAdmin =
			orgRoles.includes(AppRole.MANAGER) || orgRoles.includes(AppRole.ADMIN)
		if (!isManagerOrAdmin) throw redirect({ to: '/home' })
	},
	component: () => <Outlet />,
})
