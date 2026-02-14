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
	version: number
}

export interface CreateUnitPayload {
	id: string // Client-generated UUID for idempotency
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
	/** Required for optimistic-lock verification */
	version: number
}
