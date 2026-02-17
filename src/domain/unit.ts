export const UnitStatus = {
	VACANT: 'VACANT',
	OCCUPIED: 'OCCUPIED',
	UNDER_MAINTENANCE: 'UNDER_MAINTENANCE',
	NOTICE_GIVEN: 'NOTICE_GIVEN',
} as const

export type UnitStatus = (typeof UnitStatus)[keyof typeof UnitStatus]

export const UNIT_STATUSES: ReadonlyArray<UnitStatus> = Object.values(UnitStatus)

export const UnitType = {
	APARTMENT: 'APARTMENT',
	CONDO: 'CONDO',
	STUDIO: 'STUDIO',
	LOFT: 'LOFT',
	SUITE: 'SUITE',
	RETAIL: 'RETAIL',
	WAREHOUSE: 'WAREHOUSE',
	OTHER: 'OTHER',
} as const

export type UnitType = (typeof UnitType)[keyof typeof UnitType]

export const UNIT_TYPES: ReadonlyArray<UnitType> = Object.values(UnitType)

export interface Unit {
	id: string
	propertyId: string
	unitNumber: string
	unitType: UnitType | null
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
	unitType?: UnitType | null
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
	unitType?: UnitType | null
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
