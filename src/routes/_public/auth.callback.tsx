import { LoadingPage } from '@/components/pages'
import { oidcManager } from '@/features/auth/oidc'
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_public/auth/callback')({
	loader: async () => {
		if (!oidcManager) throw redirect({ to: '/', replace: true })

		let user
		try {
			user = await oidcManager.signinRedirectCallback()
		} catch {
			throw redirect({ to: '/', replace: true })
		}

		const returnTo = (user.state as { returnTo?: string })?.returnTo ?? '/'
		throw redirect({ to: returnTo, replace: true })
	},
	component: () => <LoadingPage />,
})
