import { FormActions, FormCard } from '@/components/ui/FormCard'
import { Button } from '@abumble/design-system/components/Button'
import { useEffect, useState } from 'react'
import { oidcManager } from '../../oidc'

export function OidcSignInForm() {
	const [loading, setLoading] = useState(false)

	useEffect(() => {
		setLoading(false)
	}, [])

	const handleSignIn = async () => {
		setLoading(true)
		try {
			await oidcManager?.signinRedirect({
				state: { returnTo: window.location.pathname + window.location.search },
			})
			// Browser navigates away — loading stays true intentionally
		} catch {
			setLoading(false)
		}
	}

	return (
		<FormCard
			title="Sign in"
			description="Sign in to your account to continue."
		>
			<FormActions fullWidth>
				<Button onClick={handleSignIn} disabled={loading || !oidcManager}>
					{loading ? 'Redirecting...' : 'Sign in'}
				</Button>
			</FormActions>
		</FormCard>
	)
}
