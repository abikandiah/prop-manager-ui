import { BaseService } from '@/api/base-service'
import type {
	Organization,
	CreateOrganizationPayload,
	UpdateOrganizationPayload,
} from '@/domain/organization'

class OrganizationsApi extends BaseService<
	Organization,
	CreateOrganizationPayload,
	UpdateOrganizationPayload
> {
	constructor() {
		super('organizations')
	}
}

export const organizationsApi = new OrganizationsApi()
