import { BaseService } from '@/api/base-service'

// --- Constants ---
export const IDEMPOTENCY_HEADER = 'X-Request-Id'

// --- Types (aligned with backend PropResponse, CreatePropRequest, UpdatePropRequest) ---

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

export interface Address {
	id: string
	addressLine1: string
	addressLine2: string | null
	city: string
	stateProvinceRegion: string
	postalCode: string
	countryCode: string
	latitude: number | null
	longitude: number | null
	createdAt: string
}

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

/** Single-line address string (comma-separated). Returns '—' when address is null/empty. */
export function formatAddress(address: Address | null): string {
	if (!address) return '—'
	const parts = [
		address.addressLine1,
		address.addressLine2,
		[address.city, address.stateProvinceRegion].filter(Boolean).join(', '),
		address.postalCode,
		address.countryCode,
	].filter(Boolean)
	return parts.join(', ') || '—'
}

/** Nested address in create payload (composite resource). Backend creates address and links it to the prop in one transaction. */
export interface CreatePropAddressPayload {
	addressLine1: string
	addressLine2?: string | null
	city: string
	stateProvinceRegion: string
	postalCode: string
	countryCode: string
	latitude?: number | null
	longitude?: number | null
}

export interface CreatePropPayload {
	legalName: string
	address: CreatePropAddressPayload
	propertyType: PropertyType
	description?: string | null
	parcelNumber?: string | null
	ownerId?: string | null
	totalArea?: number | null
	yearBuilt?: number | null
}

/** Same shape as create; when present on update, backend creates a new address and links it to the prop. */
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

// --- Service ---
class PropsApi extends BaseService<Prop, CreatePropPayload, UpdatePropPayload> {
	constructor() {
		super('props')
	}
}
export const propsApi = new PropsApi()

// --- Query Keys ---
export const propKeys = {
	all: ['props'] as const,
	lists: () => [...propKeys.all, 'list'] as const,
	list: () => propKeys.lists(),
	details: () => [...propKeys.all, 'detail'] as const,
	detail: (id: string) => [...propKeys.details(), id] as const,
}
