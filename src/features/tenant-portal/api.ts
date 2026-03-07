import { api } from '@/api/client'
import type { Tenant, UpdateTenantPayload } from '@/domain/tenant'
import type { TenantLeaseView } from '@/domain/tenant-portal'

export const tenantPortalApi = {
	// orgId is appended automatically by the axios interceptor
	async getMyLease(): Promise<TenantLeaseView> {
		const res = await api.get<TenantLeaseView>('/tenant/my-lease')
		return res.data
	},

	async getMyTenantProfile(): Promise<Tenant> {
		const res = await api.get<Tenant>('/tenants/me')
		return res.data
	},

	async updateMyTenantProfile(payload: UpdateTenantPayload): Promise<Tenant> {
		const res = await api.patch<Tenant>('/tenants/me', payload)
		return res.data
	},
}
