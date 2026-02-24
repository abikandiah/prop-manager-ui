import type {
	CreateMemberScopePayload,
	MemberScope,
	UpdateMemberScopePayload,
} from '@/domain/member-scope'
import { api } from '@/api/client'

class MemberScopesApi {
	private endpoint(orgId: string, membershipId: string): string {
		return `/organizations/${orgId}/members/${membershipId}/scopes`
	}

	async list(orgId: string, membershipId: string): Promise<Array<MemberScope>> {
		const res = await api.get<Array<MemberScope>>(
			this.endpoint(orgId, membershipId),
		)
		return res.data
	}

	async getById(
		orgId: string,
		membershipId: string,
		scopeId: string,
	): Promise<MemberScope> {
		const res = await api.get<MemberScope>(
			`${this.endpoint(orgId, membershipId)}/${scopeId}`,
		)
		return res.data
	}

	async create(
		orgId: string,
		membershipId: string,
		payload: CreateMemberScopePayload,
		headers?: Record<string, string>,
	): Promise<MemberScope> {
		const res = await api.post<MemberScope>(
			this.endpoint(orgId, membershipId),
			payload,
			{ headers },
		)
		return res.data
	}

	async update(
		orgId: string,
		membershipId: string,
		scopeId: string,
		payload: UpdateMemberScopePayload,
		headers?: Record<string, string>,
	): Promise<MemberScope> {
		const res = await api.patch<MemberScope>(
			`${this.endpoint(orgId, membershipId)}/${scopeId}`,
			payload,
			{ headers },
		)
		return res.data
	}

	async delete(
		orgId: string,
		membershipId: string,
		scopeId: string,
		headers?: Record<string, string>,
	): Promise<void> {
		await api.delete(`${this.endpoint(orgId, membershipId)}/${scopeId}`, {
			headers,
		})
	}
}

export const memberScopesApi = new MemberScopesApi()
