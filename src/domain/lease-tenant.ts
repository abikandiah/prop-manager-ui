// --- Enums ---

export const LeaseTenantRole = {
	PRIMARY: 'PRIMARY',
	OCCUPANT: 'OCCUPANT',
} as const

export type LeaseTenantRole = (typeof LeaseTenantRole)[keyof typeof LeaseTenantRole]

export const LEASE_TENANT_ROLES: ReadonlyArray<LeaseTenantRole> =
	Object.values(LeaseTenantRole)

export const LeaseTenantStatus = {
	/** Invite sent, user has not yet accepted. */
	INVITED: 'INVITED',
	/** User accepted the invite and their tenant profile is linked. */
	REGISTERED: 'REGISTERED',
	/** Tenant has signed the lease. */
	SIGNED: 'SIGNED',
} as const

export type LeaseTenantStatus =
	(typeof LeaseTenantStatus)[keyof typeof LeaseTenantStatus]

// --- Entity ---

export interface LeaseTenant {
	id: string
	leaseId: string
	/** Email address from the originating invite. */
	email: string
	role: LeaseTenantRole
	/** Derived from entity state on the server — not stored in the DB. */
	status: LeaseTenantStatus
	/** Null until the invited user accepts and their tenant profile is linked. */
	tenantId: string | null
	inviteId: string
	invitedDate: string | null
	signedDate: string | null
	version: number
	createdAt: string
	updatedAt: string
}

// --- Requests ---

export interface TenantInviteEntry {
	email: string
	role: LeaseTenantRole
}

export interface InviteLeaseTenantPayload {
	invites: Array<TenantInviteEntry>
}
