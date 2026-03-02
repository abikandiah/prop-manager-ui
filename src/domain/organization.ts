export interface Organization {
	id: string
	name: string
	settings: Record<string, any>
	version: number
	createdAt: string
	updatedAt: string
}

/** Simplified organization returned in /me response. */
export interface UserOrganization {
	id: string
	name: string
	createdAt: string
	updatedAt: string
}

export interface CreateOrganizationPayload {
	id: string
	name: string
	settings?: Record<string, any>
}

export interface UpdateOrganizationPayload {
	name?: string
	settings?: Record<string, any>
	version: number
}
