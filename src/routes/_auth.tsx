import { emitApiEvent, useApiEvent } from '@/api/events'
import { DevAuthForm } from '@/components/DevAuthForm'
import { BannerLandingPage } from '@/components/pages'
import { RegisterForm } from '@/components/RegisterForm'
import { config } from '@/config'
import { NetworkProvider } from '@/contexts/network'
import { OrganizationProvider } from '@/contexts/organization'
import { authQueryOptions, useAuth } from '@/features/auth'
import * as TanStackQueryProvider from '@/integrations/tanstack-query/user-provider'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { useEffect, useMemo } from 'react'

export const Route = createFileRoute('/_auth')({
	beforeLoad: async ({ context }) => {
		try {
			await context.globalClient.ensureQueryData(authQueryOptions)
		} catch (error) {
			console.warn('[Auth] Failed to load user:', error)

			if (!config.isDevelopment) {
				if (config.authRedirectUrl) {
					window.location.href = config.authRedirectUrl
				} else {
					throw error
				}
			}
		}
	},
	component: RouteComponent,
})

function RouteComponent() {
	const { user } = useAuth()

	if (!user) {
		return (
			<BannerLandingPage>
				<DevAuthForm />
			</BannerLandingPage>
		)
	}

	if (!user.termsAccepted) {
		return (
			<BannerLandingPage>
				<RegisterForm />
			</BannerLandingPage>
		)
	}

	return <AppWithProviders />
}

/**
 * App shell with user-scoped providers.
 * Only rendered when the user is authenticated and has accepted terms.
 */
function AppWithProviders() {
	const { user, isLoadingUser, isUserDefined, logout } = useAuth()

	// Create user-scoped queryContext
	const userId = user!.id
	const userQueryContext = useMemo(() => {
		console.log('[App] Creating query client for user:', userId)
		return TanStackQueryProvider.getUserContext(userId)
	}, [userId])

	// Logout event handler
	useApiEvent('api-unauthorized', logout)

	// If user no longer defined, emit unauthorized
	useEffect(() => {
		if (!isLoadingUser && !isUserDefined) emitApiEvent('api-unauthorized')
	}, [isLoadingUser, isUserDefined])

	return (
		<TanStackQueryProvider.Provider {...userQueryContext}>
			<NetworkProvider>
				<OrganizationProvider>
					<Outlet />
				</OrganizationProvider>
			</NetworkProvider>
		</TanStackQueryProvider.Provider>
	)
}
