import { createContext, useCallback, useContext } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { api, clearDevToken } from '@/api/client'
import { clearUserDb } from '@/features/offline/db'
import { config } from '@/config'

import type { Organization } from '@/domain/organization'

export interface User {
	id: string
	email: string
	name: string
	roles: string[]
	termsAccepted: boolean
	organizations: Organization[]
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
		queryFn: async () => {
			const { data } = await api.get<User>('/me')
			console.log(data)
			return data
		},
		staleTime: Infinity,
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
