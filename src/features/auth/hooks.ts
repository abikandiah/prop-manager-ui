import { clearDevToken } from '@/api/client'
import { config } from '@/config'
import { useOrganization } from '@/contexts/organization'
import type { AppRole, UserUpdatePayload } from '@/domain/user'
import { globalClient } from '@/integrations/tanstack-query/globalClient'
import { oidcManager } from './oidc'
import {
	queryOptions,
	useMutation,
	useQuery,
	useQueryClient,
} from '@tanstack/react-query'
import { clearUserDb } from '../offline/db'
import { authApi } from './api'

export const authQueryOptions = queryOptions({
	queryKey: ['me'],
	queryFn: authApi.me,
	staleTime: Infinity,
})

/**
 * Returns the current user and auth actions.
 * Safe to call from any route — uses globalClient directly rather than route context.
 * logout and refreshUser are no-ops when no user is present.
 */
export function useAuth() {
	const userClient = useQueryClient()
	// true when inside AppWithProviders' user-scoped QueryClientProvider
	const hasUserScopedClient = userClient !== globalClient

	const { data: user, isLoading } = useQuery(
		{
			...authQueryOptions,
			refetchInterval: config.userRefetchIntervalMs,
		},
		globalClient,
	)

	const refreshUser = async () => {
		await globalClient.invalidateQueries(authQueryOptions)
	}

	const logout = !user
		? async () => {}
		: async () => {
				let logoutUrl: string | undefined

				if (!config.isDevelopment && oidcManager) {
					await oidcManager.removeUser()
				}

				try {
					const data = await authApi.logout()
					logoutUrl = data.logoutUrl
				} catch (error) {
					console.error('[Auth] Backend logout failed:', error)
				}

				// Only clear user-scoped client — skip if useQueryClient() returned globalClient
				if (hasUserScopedClient) {
					userClient.clear()
				}

				console.log('[Auth] Clearing local DB for user:', user.id)
				await clearUserDb(user.id)

				if (config.isDevelopment) {
					clearDevToken()
				}

				// Clear /me from globalClient
				globalClient.setQueryData(authQueryOptions.queryKey, undefined)
				// Redirect to OIDC logout URL or home
				window.location.href = logoutUrl || '/'
			}

	return {
		user,
		isLoadingUser: isLoading,
		isUserDefined: !!user,
		refreshUser,
		logout,
	}
}

/** Updates the current user's profile (name, phone). Invalidates /me on success. */
export function useUpdateMe() {
	return useMutation({
		mutationKey: ['updateMe'],
		networkMode: 'online',
		mutationFn: (payload: UserUpdatePayload) => authApi.updateMe(payload),
		onSuccess: () => globalClient.invalidateQueries(authQueryOptions),
	})
}

/** Returns the current user's roles within the active org. Empty array if no active org or not a member. */
export function useActiveOrgRoles(): AppRole[] {
	const { user } = useAuth()
	const { activeOrgId } = useOrganization()
	return user?.organizations.find((o) => o.id === activeOrgId)?.roles ?? []
}
