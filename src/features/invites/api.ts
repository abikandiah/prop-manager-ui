import { api } from '@/api/client'
import type { Invite, CreateInvitePayload } from './types'

export const invitesApi = {
	getPreview: (token: string) =>
		api.get<any>(`/public/invites/${token}`).then((r) => r.data),

	accept: (token: string) =>
		api.post<Invite>(`/invites/${token}/accept`).then((r) => r.data),

	create: (payload: CreateInvitePayload, headers?: Record<string, string>) =>
		api
			.post<Invite>(`/invites`, payload, headers ? { headers } : undefined)
			.then((r) => r.data),

	resend: (
		id: string,
		metadata?: Record<string, any>,
		headers?: Record<string, string>,
	) =>
		api
			.post<Invite>(
				`/invites/${id}/resend`,
				metadata,
				headers ? { headers } : undefined,
			)
			.then((r) => r.data),

	revoke: (id: string, headers?: Record<string, string>) =>
		api.delete(`/invites/${id}`, { headers }).then((r) => r.data),

	list: (params: { email?: string; targetType?: string; targetId?: string }) =>
		api.get<Invite[]>(`/invites`, { params }).then((r) => r.data),
}
