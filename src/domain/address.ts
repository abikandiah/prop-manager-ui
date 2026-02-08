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
