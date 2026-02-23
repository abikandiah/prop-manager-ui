import { api } from '@/api/client'
import type { InvitePreview, InviteAcceptResponse } from './types'

export const invitesApi = {
	getPreview: (token: string) =>
		api.get<InvitePreview>(`/public/invites/${token}`).then((r) => r.data),

	accept: (token: string) =>
		api
			.post<InviteAcceptResponse>(`/invites/${token}/accept`)
			.then((r) => r.data),
}
