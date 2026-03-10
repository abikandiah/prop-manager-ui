import { isApiError } from '@/api/errors'
import { emitApiEvent, useApiEvent } from '@/api/events'
import { NotConnectedPage } from '@/components/NotConnectedPage'
import { BannerLandingPage } from '@/components/pages'
import { config } from '@/config'
import { useNetwork } from '@/contexts/network'
import { OrganizationProvider } from '@/contexts/organization'
import type { User } from '@/domain/user'
import { authQueryOptions, useAuth } from '@/features/auth'
import { DevAuthForm } from '@/features/auth/components/forms/DevAuthForm'
import { OidcSignInForm } from '@/features/auth/components/forms/OidcSignInForm'
import { RegisterForm } from '@/features/auth/components/forms/RegisterForm'
import * as TanStackQueryProvider from '@/integrations/tanstack-query/user-provider'
import { onlineManager } from '@tanstack/react-query'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { useEffect, useMemo } from 'react'

export const Route = createFileRoute('/_auth')({
	beforeLoad: async ({ context }) => {
		try {
			// Fast path: return cached user immediately (staleTime: Infinity keeps it fresh)
			const cached = context.globalClient.getQueryData<User>(
				authQueryOptions.queryKey,
			)
			if (cached) return { user: cached }

			// Server known unreachable — skip fetch, let component show NotConnectedPage
			if (!onlineManager.isOnline()) return { user: undefined }

			const user = await context.globalClient.ensureQueryData(authQueryOptions)
			return { user }
		} catch (error) {
			// Log unexpected failures; 401 is expected when unauthenticated
			if (isApiError(error) && error.status !== 401) {
				console.warn('[Auth] Failed to load user:', error)
			}

			return { user: undefined }
		}
	},
	component: RouteComponent,
})

function RouteComponent() {
	const { user, refreshUser } = useAuth()
	const { isOnline } = useNetwork()

	if (!user) {
		if (!isOnline) return <NotConnectedPage />
		if (config.isDevelopment) {
			return (
				<BannerLandingPage>
					<DevAuthForm onSuccess={refreshUser} />
				</BannerLandingPage>
			)
		}
		return (
			<BannerLandingPage>
				<OidcSignInForm />
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
	const { isOnline } = useNetwork()

	// Create user-scoped queryContext
	const userId = user!.id
	const userQueryContext = useMemo(() => {
		console.log('[App] Creating query client for user:', userId)
		return TanStackQueryProvider.getUserContext(userId)
	}, [userId])

	// Resume user-scoped paused mutations when the app comes back online
	useEffect(() => {
		if (isOnline) {
			console.log('[App] Online — resuming paused mutations for user:', userId)
			userQueryContext.userClient.resumePausedMutations()
		}
	}, [isOnline, userQueryContext.userClient, userId])

	// Logout event handler
	useApiEvent('api-unauthorized', logout)

	// If user no longer defined, emit unauthorized
	useEffect(() => {
		if (!isLoadingUser && !isUserDefined) emitApiEvent('api-unauthorized')
	}, [isLoadingUser, isUserDefined])

	return (
		<TanStackQueryProvider.Provider {...userQueryContext}>
			<OrganizationProvider>
				<Outlet />
			</OrganizationProvider>
		</TanStackQueryProvider.Provider>
	)
}
