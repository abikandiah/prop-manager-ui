import { BaseService } from '@/api/base-service'
import { api } from '@/api/client'
import type {
	Prop,
	CreatePropRequest,
	UpdatePropPayload,
} from '@/domain/property'
import type { Unit } from '@/domain/unit'

class PropsApi extends BaseService<Prop, CreatePropRequest, UpdatePropPayload> {
	constructor() {
		super('props')
	}

	async listUnits(propId: string): Promise<Unit[]> {
		const response = await api.get<Unit[]>(`${this.endpoint}/${propId}/units`)
		return response.data
	}
}
export const propsApi = new PropsApi()
