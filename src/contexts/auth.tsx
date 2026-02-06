import { createContext, useContext } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { api } from '@/api/client'

export interface User {
	id: string
	email: string
	name: string
}

interface AuthContextType {
	user: User | null
	isLoadingUser: boolean
	isUserDefined: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
	const { data: user, isLoading } = useQuery({
		queryKey: ['me'],
		queryFn: async () => {
			const { data } = await api.get<User>('/me')
			return data
		},
		staleTime: Infinity,
	})

	return (
		<AuthContext.Provider
			value={{
				user: user ?? null,
				isLoadingUser: isLoading,
				isUserDefined: !!user,
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
