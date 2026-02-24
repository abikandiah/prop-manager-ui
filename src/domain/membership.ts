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
	initialScopes: Array<{
		scopeType: 'ORG' | 'PROPERTY' | 'UNIT'
		scopeId: string
		templateId?: string
		permissions?: Record<string, string>
	}>
}

export interface UpdateMembershipPayload {
	version: number
}
