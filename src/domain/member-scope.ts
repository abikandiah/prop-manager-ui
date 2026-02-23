export type ScopeType = 'ORG' | 'PROPERTY' | 'UNIT'

export interface MemberScope {
	id: string
	membershipId: string
	scopeType: ScopeType
	/** For ORG scope, this is the org ID. For PROPERTY, the property ID. For UNIT, the unit ID. */
	scopeId: string
	/** Domain key → action letters (e.g. { l: 'rcud', m: 'r' }). */
	permissions: Record<string, string>
	version: number
	createdAt: string
	updatedAt: string
}

export interface CreateMemberScopePayload {
	scopeType: ScopeType
	/** For ORG scope, pass the org ID here. Required by the backend. */
	scopeId: string
	/** Manual permissions map. Provide either permissions or templateId, not both. */
	permissions?: Record<string, string>
	/** Template to copy defaultPermissions from. */
	templateId?: string | null
}

export interface UpdateMemberScopePayload {
	permissions?: Record<string, string>
	templateId?: string | null
	version: number
}
