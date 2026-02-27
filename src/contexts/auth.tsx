import { createContext, useContext } from 'react'
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
	termsAccepted: boolean
	organizations: Organization[]
}

interface AuthContextType {
	user: User | null
	isLoadingUser: boolean
	isUserDefined: boolean
	logout: () => Promise<void>
	refetchUser: () => Promise<unknown>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
	const queryClient = useQueryClient()
	const {
		data: user,
		isLoading,
		refetch,
	} = useQuery({
		queryKey: ['me'],
		queryFn: async () => {
			const { data } = await api.get<User>('/me')
			return data
		},
		staleTime: Infinity,
	})

	const logout = async () => {
		if (user?.id) {
			console.log('[Auth] Logging out user:', user.id)
			await clearUserDb(user.id)
		}

		// Clear local storage token in development
		if (config.isDevelopment) {
			clearDevToken()
		}

		queryClient.clear()

		try {
			// Call backend logout endpoint to get optional OIDC redirect URL
			const { data } = await api.post<{ logoutUrl?: string }>('/logout')

			if (data.logoutUrl) {
				window.location.href = data.logoutUrl
				return
			}
		} catch (error) {
			console.error('[Auth] Backend logout failed:', error)
		}

		// Fallback redirect to home
		window.location.href = '/'
	}

	const refetchUser = async () => {
		return refetch()
	}

	return (
		<AuthContext.Provider
			value={{
				user: user ?? null,
				isLoadingUser: isLoading,
				isUserDefined: !!user,
				logout,
				refetchUser,
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
