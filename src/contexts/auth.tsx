import { api, clearDevToken } from '@/api/client'
import { config } from '@/config'
import { clearUserDb } from '@/features/offline/db'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { createContext, useCallback, useContext } from 'react'

import type { UserOrganization } from '@/domain/organization'
import { AppRole } from '@/domain/user'
import type { AccessEntry } from '@/lib/permissions'

export interface User {
	id: string
	email: string
	name: string
	termsAccepted: boolean
	organizations: UserOrganization[]
	roles: AppRole[]
	access: AccessEntry[]
}

/** Raw shape returned by /api/me — `uiRoles` is mapped to `roles` on the way in. */
interface RawUserResponse extends Omit<User, 'roles'> {
	uiRoles: AppRole[]
}

interface AuthContextType {
	user: User | null
	isLoadingUser: boolean
	isUserDefined: boolean
	logout: () => Promise<void>
	refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
	const queryClient = useQueryClient()
	const { data: user, isLoading } = useQuery({
		queryKey: ['me'],
		queryFn: async (): Promise<User> => {
			const { data } = await api.get<RawUserResponse>('/me')
			const { uiRoles, ...rest } = data
			return { ...rest, roles: uiRoles ?? [] }
		},
		staleTime: Infinity,
		refetchInterval: config.userRefetchIntervalMs,
	})

	// Create a stable reference to a refresh function
	const refreshUser = useCallback(async () => {
		await queryClient.invalidateQueries({ queryKey: ['me'] })
	}, [queryClient])

	const logout = useCallback(async () => {
		let logoutUrl: string | undefined

		try {
			// Call backend logout endpoint while we still have the token
			const { data } = await api.post<{ logoutUrl?: string }>('/logout')
			logoutUrl = data.logoutUrl
		} catch (error) {
			console.error('[Auth] Backend logout failed:', error)
		}

		if (user?.id) {
			console.log('[Auth] Clearing local DB for user:', user.id)
			await clearUserDb(user.id)
		}

		// Clear local storage token in development
		if (config.isDevelopment) {
			clearDevToken()
		}

		queryClient.clear()

		// Redirect to logout URL from OIDC provider or fallback to home
		window.location.href = logoutUrl || '/'
	}, [user?.id, queryClient])

	return (
		<AuthContext.Provider
			value={{
				user: user ?? null,
				isLoadingUser: isLoading,
				isUserDefined: !!user,
				logout,
				refreshUser,
			}}
		>
			{children}
		</AuthContext.Provider>
	)
}

export const useAuth = () => {
	const context = useContext(AuthContext)
	if (context === undefined) {
		throw new Error('useAuth must be used within an AuthProvider')
	}
	return context
}
