import { api } from '@/api/client'
import type { LeaseTenant, InviteLeaseTenantPayload } from '@/domain/lease-tenant'

const endpoint = (leaseId: string) => `leases/${leaseId}/tenants`

class LeaseTenantApi {
	async list(leaseId: string): Promise<Array<LeaseTenant>> {
		const res = await api.get<Array<LeaseTenant>>(endpoint(leaseId))
		return res.data
	}

	async invite(
		leaseId: string,
		payload: InviteLeaseTenantPayload,
		headers?: Record<string, string>,
	): Promise<Array<LeaseTenant>> {
		const res = await api.post<Array<LeaseTenant>>(
			`${endpoint(leaseId)}/invite`,
			payload,
			{ headers },
		)
		return res.data
	}

	async remove(leaseId: string, leaseTenantId: string): Promise<void> {
		await api.delete(`${endpoint(leaseId)}/${leaseTenantId}`)
	}
}

export const leaseTenantApi = new LeaseTenantApi()
