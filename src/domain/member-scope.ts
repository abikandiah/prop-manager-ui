export type ScopeType = 'ORG' | 'PROPERTY' | 'UNIT'

/** UI shape for defining a single scope during creation (invite form, add-scope dialog). */
export type ScopeConfigValue = {
	scopeType: ScopeType
	scopeId: string
	useTemplate: boolean
	templateId?: string
	permissions: Record<string, string>
}

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
	id: string
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
