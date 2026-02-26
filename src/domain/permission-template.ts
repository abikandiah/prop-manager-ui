export type ScopeType = 'ORG' | 'PROPERTY' | 'UNIT'

export interface MembershipTemplateItem {
	scopeType: ScopeType
	/** Domain key → action letters (e.g. { l: 'rcud', m: 'r' }). */
	permissions: Record<string, string>
}

export interface PermissionTemplate {
	id: string
	/** Organization ID; null for system-wide templates. */
	orgId: string | null
	name: string
	items: MembershipTemplateItem[]
	version: number
	createdAt: string
	updatedAt: string
}

export interface CreatePermissionTemplatePayload {
	name: string
	orgId?: string | null
	items: MembershipTemplateItem[]
}

export interface UpdatePermissionTemplatePayload {
	name?: string
	items?: MembershipTemplateItem[]
	version: number
}
