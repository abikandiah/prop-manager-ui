import { api } from '@/api/client'
import type { Invite, InvitePreviewResponse, TargetType } from './types'

class InvitesApi {
	/**
	 * Preview an invitation without authentication.
	 */
	async getPreview(token: string): Promise<InvitePreviewResponse> {
		const res = await api.get<InvitePreviewResponse>(`public/invites/${token}`)
		return res.data
	}

	/**
	 * Resend an invitation email.
	 */
	async resend(id: string, headers?: Record<string, string>): Promise<Invite> {
		const res = await api.post<Invite>(`invites/${id}/resend`, undefined, {
			headers,
		})
		return res.data
	}

	/**
	 * Revoke a pending invitation.
	 */
	async revoke(id: string, headers?: Record<string, string>): Promise<void> {
		await api.delete(`invites/${id}`, { headers })
	}

	/**
	 * Accept an invitation.
	 */
	async accept(
		token: string,
		headers?: Record<string, string>,
	): Promise<Invite> {
		const res = await api.post<Invite>(`invites/${token}/accept`, undefined, {
			headers,
		})
		return res.data
	}

	/**
	 * List invitations by email or target.
	 */
	async list(
		params: { email?: string; targetType?: TargetType; targetId?: string },
		headers?: Record<string, string>,
	): Promise<Invite[]> {
		const res = await api.get<Invite[]>('invites', { params, headers })
		return res.data
	}
}

export const invitesApi = new InvitesApi()
