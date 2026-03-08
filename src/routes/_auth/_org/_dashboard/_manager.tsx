import { AppRole } from '@/domain/user'
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/_org/_dashboard/_manager')({
	beforeLoad: ({ context }) => {
		const { user, orgId } = context
		// No user/org: let _auth/_org layouts handle it (DevAuthForm, OnboardingForm)
		if (!user || !orgId) return
		const orgRoles = user.organizations.find((o) => o.id === orgId)?.roles ?? []
		const isManagerOrAdmin =
			orgRoles.includes(AppRole.MANAGER) || orgRoles.includes(AppRole.ADMIN)
		if (!isManagerOrAdmin) throw redirect({ to: '/home' })
	},
	component: () => <Outlet />,
})
