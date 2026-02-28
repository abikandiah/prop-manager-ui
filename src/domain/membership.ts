import type { ResourceType } from './policy-assignment'

export enum InviteStatus {
	PENDING = 'PENDING',
	ACCEPTED = 'ACCEPTED',
	EXPIRED = 'EXPIRED',
	REVOKED = 'REVOKED',
}

export interface Membership {
	id: string
	userId: string | null
	userName: string | null
	userEmail: string | null
	organizationId: string
	inviteId: string | null
	inviteEmail: string | null
	inviteStatus: InviteStatus | null
	lastResentAt: string | null
	expiresAt: string | null
	version: number
	createdAt: string
	updatedAt: string
}

export interface CreateMembershipPayload {
	id: string
	userId: string
}

export interface InviteMemberPayload {
	email: string
	/** Direct policy assignments to create alongside the membership. */
	assignments?: Array<{
		resourceType: ResourceType
		resourceId: string
		policyId?: string | null
		overrides?: Record<string, string> | null
	}>
}

export interface UpdateMembershipPayload {
	version: number
}
