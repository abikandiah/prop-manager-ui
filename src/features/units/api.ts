import type { CreateUnitPayload, Unit, UpdateUnitPayload } from '@/domain/unit'
import { api } from '@/api/client'
import { BaseService } from '@/api/base-service'

const ENDPOINT = 'units'

class UnitsApi extends BaseService<Unit, CreateUnitPayload, UpdateUnitPayload> {
	constructor() {
		super(ENDPOINT)
	}

	async listByPropId(propId: string): Promise<Array<Unit>> {
		const res = await api.get<Array<Unit>>(this.endpoint, {
			params: { propId },
		})
		return res.data
	}
}

export const unitsApi = new UnitsApi()
