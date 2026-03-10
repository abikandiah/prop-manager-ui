import { LoadingPage } from '@/components/pages'
import { oidcManager } from '@/features/auth/oidc'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

export const Route = createFileRoute('/_public/auth/callback')({
	component: AuthCallbackPage,
})

function AuthCallbackPage() {
	const navigate = useNavigate()

	useEffect(() => {
		if (!oidcManager) {
			navigate({ to: '/', replace: true })
			return
		}

		oidcManager
			.signinRedirectCallback()
			.then((user) => {
				const returnTo = (user.state as { returnTo?: string })?.returnTo ?? '/'
				navigate({ to: returnTo, replace: true })
			})
			.catch(() => navigate({ to: '/', replace: true }))
	}, [navigate])

	return <LoadingPage />
}
