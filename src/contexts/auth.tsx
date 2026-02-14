import { createContext, useContext } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { api } from '@/api/client'
import { clearUserDb } from '@/features/offline/db'

export interface User {
	id: string
	email: string
	name: string
}

interface AuthContextType {
	user: User | null
	isLoadingUser: boolean
	isUserDefined: boolean
	logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
	const queryClient = useQueryClient()
	const { data: user, isLoading } = useQuery({
		queryKey: ['me'],
		queryFn: async () => {
			const { data } = await api.get<User>('/me')
			return data
		},
		staleTime: Infinity,
	})

	const logout = async () => {
		// Clear user's offline database
		if (user?.id) {
			console.log('[Auth] Logging out user:', user.id)
			await clearUserDb(user.id)
		}

		// Clear query cache
		queryClient.clear()

		// TODO: Call backend logout endpoint
		// await api.post('/logout')

		// Redirect or refresh
		window.location.href = '/'
	}

	return (
		<AuthContext.Provider
			value={{
				user: user ?? null,
				isLoadingUser: isLoading,
				isUserDefined: !!user,
				logout,
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
