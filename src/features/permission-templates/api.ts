import type {
	CreatePermissionTemplatePayload,
	PermissionTemplate,
	UpdatePermissionTemplatePayload,
} from '@/domain/permission-template'
import { api } from '@/api/client'
import { BaseService } from '@/api/base-service'

const ENDPOINT = 'membership-templates'

class PermissionTemplatesApi extends BaseService<
	PermissionTemplate,
	CreatePermissionTemplatePayload,
	UpdatePermissionTemplatePayload
> {
	constructor() {
		super(ENDPOINT)
	}

	/** List system templates plus templates belonging to the given org. */
	async listByOrg(orgId: string): Promise<Array<PermissionTemplate>> {
		const res = await api.get<Array<PermissionTemplate>>(this.endpoint, {
			params: { orgId },
		})
		return res.data
	}
}

export const permissionTemplatesApi = new PermissionTemplatesApi()
