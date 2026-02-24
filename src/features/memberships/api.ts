import { api } from '@/api/client'
import type {
	Membership,
	UpdateMembershipPayload,
	InviteMemberPayload,
} from '@/domain/membership'

class MembershipsApi {
	/** Lists members for an organization. */
	async listByOrganization(orgId: string): Promise<Membership[]> {
		const res = await api.get<Membership[]>(`/organizations/${orgId}/members`)
		return res.data
	}

	/** Gets a specific membership. */
	async getById(orgId: string, membershipId: string): Promise<Membership> {
		const res = await api.get<Membership>(
			`/organizations/${orgId}/members/${membershipId}`,
		)
		return res.data
	}

	/** Invites a new member by email with initial scopes. */
	async inviteMember(
		orgId: string,
		payload: InviteMemberPayload,
		headers?: Record<string, string>,
	): Promise<Membership> {
		const res = await api.post<Membership>(
			`/organizations/${orgId}/members/invites`,
			payload,
			headers ? { headers } : undefined,
		)
		return res.data
	}

	/** Updates a membership (e.g. optimistic lock check). */
	async update(
		orgId: string,
		membershipId: string,
		payload: UpdateMembershipPayload,
		headers?: Record<string, string>,
	): Promise<Membership> {
		const res = await api.patch<Membership>(
			`/organizations/${orgId}/members/${membershipId}`,
			payload,
			headers ? { headers } : undefined,
		)
		return res.data
	}

	/** Revokes/Deletes a membership. */
	async delete(
		orgId: string,
		membershipId: string,
		headers?: Record<string, string>,
	): Promise<void> {
		await api.delete(`/organizations/${orgId}/members/${membershipId}`, {
			headers,
		})
	}
}

export const membershipsApi = new MembershipsApi()
