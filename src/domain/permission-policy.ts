/** Flat permission policy — permissions are a single map with no scope-type structure. */
export interface PermissionPolicy {
	id: string
	/** Organization ID; null for system-wide policies. */
	orgId: string | null
	name: string
	/** Domain key → action letters (e.g. { l: 'rcud', m: 'r' }). No scope type embedded. */
	permissions: Record<string, string>
	version: number
	createdAt: string
	updatedAt: string
}

export interface CreatePermissionPolicyPayload {
	name: string
	permissions: Record<string, string>
}

export interface UpdatePermissionPolicyPayload {
	name?: string
	permissions?: Record<string, string>
	version: number
}
