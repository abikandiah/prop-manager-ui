export interface Tenant {
	id: string
	userId: string
	name: string
	email: string
	phoneNumber: string | null
	avatarUrl: string | null
	emergencyContactName: string | null
	emergencyContactPhone: string | null
	hasPets: boolean | null
	petDescription: string | null
	vehicleInfo: string | null
	notes: string | null
	createdAt: string
	updatedAt: string
	version: number
}
