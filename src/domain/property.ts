import type { Address, CreatePropAddressPayload } from './address'

export const PROPERTY_TYPES = [
	'SINGLE_FAMILY_HOME', // A standalone house
	'APARTMENT_BUILDING', // A multi-unit residential building
	'CONDO_UNIT', // A single unit within a shared building
	'TOWNHOUSE', // Row housing
	'COMMERCIAL', // Offices/Retail
	'INDUSTRIAL', // Warehouses
	'MIXED_USE', // Commercial + Residential
] as const
export type PropertyType = (typeof PROPERTY_TYPES)[number]

export interface Prop {
	id: string
	legalName: string
	addressId: string
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
	id: string // Client-generated UUID for idempotency
	legalName: string
	address: CreatePropAddressPayload
	propertyType: PropertyType
	description?: string | null
	parcelNumber?: string | null
	ownerId?: string | null
	totalArea?: number | null
	yearBuilt?: number | null
}

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
