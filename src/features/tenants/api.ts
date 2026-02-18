import type { Tenant } from '@/domain/tenant'
import { BaseService } from '@/api/base-service'

class TenantsApi extends BaseService<Tenant, never, never> {
	constructor() {
		super('tenants')
	}
}

export const tenantsApi = new TenantsApi()
