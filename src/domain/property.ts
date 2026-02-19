import type { Address, CreatePropAddressPayload } from './address'

export const PropertyType = {
	SINGLE_FAMILY_HOME: 'SINGLE_FAMILY_HOME', // A standalone house
	APARTMENT_BUILDING: 'APARTMENT_BUILDING', // A multi-unit residential building
	CONDOMINIUM: 'CONDOMINIUM', // A single unit within a shared building
	TOWNHOUSE: 'TOWNHOUSE', // Row housing
	COMMERCIAL: 'COMMERCIAL', // Offices/Retail
	INDUSTRIAL: 'INDUSTRIAL', // Warehouses
	MIXED_USE: 'MIXED_USE', // Commercial + Residential
} as const

export type PropertyType = (typeof PropertyType)[keyof typeof PropertyType]

export const PROPERTY_TYPES: ReadonlyArray<PropertyType> =
	Object.values(PropertyType)

/** API response for a property. Matches backend PropResponse (addressId/address null when address not set). */
export interface Prop {
	id: string
	legalName: string
	addressId: string | null
	address: Address | null
	propertyType: PropertyType
	description: string | null
	parcelNumber: string | null
	ownerId: string | null
	totalArea: number | null
	yearBuilt: number | null
	createdAt: string
	updatedAt: string
	version: number
}

export interface CreatePropPayload {
	/** Client-generated id for optimistic update and idempotency key; not sent in request body. */
	id: string
	legalName: string
	address: CreatePropAddressPayload
	propertyType: PropertyType
	description?: string | null
	parcelNumber?: string | null
	ownerId?: string | null
	totalArea?: number | null
	yearBuilt?: number | null
	/** Optional; shared form shape with UpdatePropPayload. Not sent to create API. */
	version?: number
}

/** Request body for POST /props. Matches backend CreatePropRequest (no id; server generates it). */
export type CreatePropRequest = Omit<CreatePropPayload, 'id'>

/** Request body for PATCH /props/{id}. Matches backend UpdatePropRequest (version required for optimistic locking). */
export interface UpdatePropPayload {
	legalName?: string
	address?: CreatePropAddressPayload
	propertyType?: PropertyType
	description?: string | null
	parcelNumber?: string | null
	ownerId?: string | null
	totalArea?: number | null
	yearBuilt?: number | null
	/** Required for optimistic-lock verification */
	version: number
}
