import { AppRole } from '@/domain/user'
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/_org/_dashboard/_tenant')({
	beforeLoad: ({ context }) => {
		const { user, orgId } = context
		// No user/org: let _auth/_org layouts handle it (DevAuthForm, OnboardingForm)
		if (!user || !orgId) return
		const orgRoles = user.organizations.find((o) => o.id === orgId)?.roles ?? []
		if (!orgRoles.includes(AppRole.TENANT)) throw redirect({ to: '/home' })
	},
	component: () => <Outlet />,
})
