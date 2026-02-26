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
	/** Optional template to link to the membership. Template items resolve live at JWT hydration. */
	templateId?: string
	/** Binding scope rows. For ORG-only templates, omit or leave empty. For PROPERTY/UNIT templates,
	 *  include one row per resource (empty permissions = pure binding row). */
	initialScopes?: Array<{
		scopeType: 'ORG' | 'PROPERTY' | 'UNIT'
		scopeId: string
		permissions?: Record<string, string>
	}>
}

export interface UpdateMembershipPayload {
	version: number
}
