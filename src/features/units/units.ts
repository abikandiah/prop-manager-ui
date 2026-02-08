import { api } from '@/api/client'
import { BaseService } from '@/api/base-service'

// --- Types (aligned with backend UnitResponse, CreateUnitRequest, UpdateUnitRequest) ---

export const UNIT_STATUSES = [
	'VACANT',
	'OCCUPIED',
	'UNDER_MAINTENANCE',
	'NOTICE_GIVEN',
] as const
export type UnitStatus = (typeof UNIT_STATUSES)[number]

export interface Unit {
	id: string
	propertyId: string
	unitNumber: string
	status: UnitStatus
	description: string | null
	rentAmount: number | null
	securityDeposit: number | null
	bedrooms: number | null
	bathrooms: number | null
	squareFootage: number | null
	balcony: boolean | null
	laundryInUnit: boolean | null
	hardwoodFloors: boolean | null
	createdAt: string
	updatedAt: string
}

export interface CreateUnitPayload {
	propertyId: string
	unitNumber: string
	status: UnitStatus
	description?: string | null
	rentAmount?: number | null
	securityDeposit?: number | null
	bedrooms?: number | null
	bathrooms?: number | null
	squareFootage?: number | null
	balcony?: boolean | null
	laundryInUnit?: boolean | null
	hardwoodFloors?: boolean | null
}

export interface UpdateUnitPayload {
	propertyId?: string
	unitNumber?: string
	status?: UnitStatus
	description?: string | null
	rentAmount?: number | null
	securityDeposit?: number | null
	bedrooms?: number | null
	bathrooms?: number | null
	squareFootage?: number | null
	balcony?: boolean | null
	laundryInUnit?: boolean | null
	hardwoodFloors?: boolean | null
}

// --- Service ---

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

// --- Query Keys ---

export const unitKeys = {
	all: ['units'] as const,
	lists: () => [...unitKeys.all, 'list'] as const,
	list: (propId: string | null) =>
		propId == null
			? (['units', 'list'] as const)
			: ([...unitKeys.all, 'list', propId] as const),
	details: () => [...unitKeys.all, 'detail'] as const,
	detail: (id: string) => [...unitKeys.details(), id] as const,
}
