import type {
	CreatePermissionPolicyPayload,
	PermissionPolicy,
	UpdatePermissionPolicyPayload,
} from '@/domain/permission-policy'
import { api } from '@/api/client'
import { BaseService } from '@/api/base-service'

const ENDPOINT = 'permission-policies'

class PermissionPoliciesApi extends BaseService<
	PermissionPolicy,
	CreatePermissionPolicyPayload,
	UpdatePermissionPolicyPayload
> {
	constructor() {
		super(ENDPOINT)
	}

	/** List system policies plus policies belonging to the given org. */
	async listByOrg(orgId: string): Promise<Array<PermissionPolicy>> {
		const res = await api.get<Array<PermissionPolicy>>(this.endpoint, {
			params: { orgId },
		})
		return res.data
	}
}

export const permissionPoliciesApi = new PermissionPoliciesApi()
