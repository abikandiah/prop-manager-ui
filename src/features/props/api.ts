import { BaseService } from '@/api/base-service'
import type {
	Prop,
	CreatePropPayload,
	UpdatePropPayload,
} from '@/domain/property'

class PropsApi extends BaseService<Prop, CreatePropPayload, UpdatePropPayload> {
	constructor() {
		super('props')
	}
}
export const propsApi = new PropsApi()
