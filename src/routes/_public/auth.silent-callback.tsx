import { oidcManager } from '@/features/auth/oidc'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_public/auth/silent-callback')({
	loader: async () => {
		if (!oidcManager) return
		try {
			await oidcManager.signinSilentCallback()
		} catch {
			// Errors are surfaced via UserManager events in the parent window
		}
	},
	component: () => null,
})
