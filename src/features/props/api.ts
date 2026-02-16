import type {
	CreatePropRequest,
	Prop,
	UpdatePropPayload,
} from '@/domain/property'
import type { Unit } from '@/domain/unit'
import { BaseService } from '@/api/base-service'
import { api } from '@/api/client'

class PropsApi extends BaseService<Prop, CreatePropRequest, UpdatePropPayload> {
	constructor() {
		super('props')
	}

	async listUnits(propId: string): Promise<Array<Unit>> {
		const response = await api.get<Array<Unit>>(`${this.endpoint}/${propId}/units`)
		return response.data
	}
}
export const propsApi = new PropsApi()
