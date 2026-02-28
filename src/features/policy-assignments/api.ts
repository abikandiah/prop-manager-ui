import type {
	CreatePolicyAssignmentPayload,
	PolicyAssignment,
	UpdatePolicyAssignmentPayload,
} from '@/domain/policy-assignment'
import { api } from '@/api/client'

class PolicyAssignmentsApi {
	private endpoint(orgId: string, membershipId: string): string {
		return `/organizations/${orgId}/members/${membershipId}/assignments`
	}

	async list(
		orgId: string,
		membershipId: string,
	): Promise<Array<PolicyAssignment>> {
		const res = await api.get<Array<PolicyAssignment>>(
			this.endpoint(orgId, membershipId),
		)
		return res.data
	}

	async getById(
		orgId: string,
		membershipId: string,
		assignmentId: string,
	): Promise<PolicyAssignment> {
		const res = await api.get<PolicyAssignment>(
			`${this.endpoint(orgId, membershipId)}/${assignmentId}`,
		)
		return res.data
	}

	async create(
		orgId: string,
		membershipId: string,
		payload: CreatePolicyAssignmentPayload,
		headers?: Record<string, string>,
	): Promise<PolicyAssignment> {
		const res = await api.post<PolicyAssignment>(
			this.endpoint(orgId, membershipId),
			payload,
			{ headers },
		)
		return res.data
	}

	async update(
		orgId: string,
		membershipId: string,
		assignmentId: string,
		payload: UpdatePolicyAssignmentPayload,
		headers?: Record<string, string>,
	): Promise<PolicyAssignment> {
		const res = await api.patch<PolicyAssignment>(
			`${this.endpoint(orgId, membershipId)}/${assignmentId}`,
			payload,
			{ headers },
		)
		return res.data
	}

	async delete(
		orgId: string,
		membershipId: string,
		assignmentId: string,
		headers?: Record<string, string>,
	): Promise<void> {
		await api.delete(`${this.endpoint(orgId, membershipId)}/${assignmentId}`, {
			headers,
		})
	}
}

export const policyAssignmentsApi = new PolicyAssignmentsApi()
