import { emitApiEvent, useApiEvent } from '@/api/events'
import { DevAuthForm } from '@/components/DevAuthForm'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import { BannerLandingPage, LoadingPage } from '@/components/pages'
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

			if (!config.isDevelopment && config.authRedirectUrl) {
				window.location.href = config.authRedirectUrl
			}
		}
	},
	pendingComponent: LoadingPage,
	component: RouteComponent,
})

function RouteComponent() {
	const { user } = useAuth()

	if (!user) {
		return (
			<BannerLandingPage>
				<Header />
				<DevAuthForm />
				<Footer />
			</BannerLandingPage>
		)
	}

	if (!user.termsAccepted) {
		return (
			<BannerLandingPage>
				<Header />
				<RegisterForm />
				<Footer />
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

	// user is always defined here (RouteComponent guards above), but typed as optional
	const userId = user!.id

	// Create user-scoped query client — recreated only when userId changes
	const queryContext = useMemo(() => {
		console.log('[App] Creating query client for user:', userId)
		return TanStackQueryProvider.getUserContext(userId)
	}, [userId])

	// Single logout handler — both trigger paths converge here
	useApiEvent('api-unauthorized', logout)

	// Emit the same event when /me polling detects the session is gone
	useEffect(() => {
		if (!isLoadingUser && !isUserDefined) emitApiEvent('api-unauthorized')
	}, [isLoadingUser, isUserDefined])

	return (
		<TanStackQueryProvider.Provider {...queryContext}>
			<NetworkProvider>
				<OrganizationProvider>
					<Outlet />
				</OrganizationProvider>
			</NetworkProvider>
		</TanStackQueryProvider.Provider>
	)
}
