import type {
	CreateLeaseTemplatePayload,
	LeaseTemplate,
	UpdateLeaseTemplatePayload,
} from '@/domain/lease-template'
import { api } from '@/api/client'
import { BaseService } from '@/api/base-service'

const ENDPOINT = 'lease-templates'

class LeaseTemplatesApi extends BaseService<
	LeaseTemplate,
	CreateLeaseTemplatePayload,
	UpdateLeaseTemplatePayload
> {
	constructor() {
		super(ENDPOINT)
	}

	/** List active lease templates only */
	async listActive(): Promise<Array<LeaseTemplate>> {
		const res = await api.get<Array<LeaseTemplate>>(this.endpoint, {
			params: { active: true },
		})
		return res.data
	}

	/** Search lease templates by name */
	async search(query: string): Promise<Array<LeaseTemplate>> {
		const res = await api.get<Array<LeaseTemplate>>(this.endpoint, {
			params: { search: query },
		})
		return res.data
	}
}

export const leaseTemplatesApi = new LeaseTemplatesApi()
