import { BaseService } from '@/api/base-service'
import type {
	Prop,
	CreatePropRequest,
	UpdatePropPayload,
} from '@/domain/property'

class PropsApi extends BaseService<Prop, CreatePropRequest, UpdatePropPayload> {
	constructor() {
		super('props')
	}
}
export const propsApi = new PropsApi()
