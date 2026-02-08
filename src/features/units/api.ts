import { api } from '@/api/client'
import { BaseService } from '@/api/base-service'
import type {
	Unit,
	CreateUnitPayload,
	UpdateUnitPayload,
} from '@/domain/unit'

const ENDPOINT = 'units'

class UnitsApi extends BaseService<Unit, CreateUnitPayload, UpdateUnitPayload> {
	constructor() {
		super(ENDPOINT)
	}

	async listByPropId(propId: string): Promise<Unit[]> {
		const res = await api.get<Unit[]>(this.endpoint, {
			params: { propId },
		})
		return res.data
	}
}

export const unitsApi = new UnitsApi()
