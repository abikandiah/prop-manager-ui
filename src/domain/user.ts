import type { AccessEntry } from '@/lib/permissions'

export enum AppRole {
	ADMIN = 'ADMIN',
	MANAGER = 'MANAGER',
	TENANT = 'TENANT',
	OTHER = 'OTHER',
}

export interface User {
	id: string
	email: string
	name: string
	termsAccepted: boolean
	organizations: UserOrganization[]
	roles: AppRole[]
	access: AccessEntry[]
}

export interface UserUpdatePayload {
	termsAccepted: boolean
}

export interface UserOrganization {
	id: string
	name: string
	createdAt: string
	updatedAt: string
}
