import { api } from '@/api/client'
import type { AppRole, User, UserUpdatePayload } from '@/domain/user'

/** Raw shape returned by /api/me — `uiRoles` is mapped to `roles` on the way in. */
interface RawUserResponse extends Omit<User, 'roles'> {
	uiRoles: AppRole[]
}

class AuthApi {
	async me(): Promise<User> {
		const { data } = await api.get<RawUserResponse>('/me')
		const { uiRoles, ...rest } = data
		return { ...rest, roles: uiRoles ?? [] }
	}

	async updateMe(payload: UserUpdatePayload): Promise<User> {
		const res = await api.patch<User>('/me', payload)
		return res.data
	}

	async logout(): Promise<{ logoutUrl?: string }> {
		const res = await api.post<{ logoutUrl?: string }>('/logout')
		return res.data
	}
}

export const authApi = new AuthApi()
