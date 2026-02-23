export interface PermissionTemplate {
	id: string
	/** Organization ID; null for system-wide templates. */
	orgId: string | null
	name: string
	/** Domain key → action letters (e.g. { l: 'rcud', m: 'r' }). */
	defaultPermissions: Record<string, string>
	version: number
	createdAt: string
	updatedAt: string
}

export interface CreatePermissionTemplatePayload {
	name: string
	orgId?: string | null
	defaultPermissions: Record<string, string>
}

export interface UpdatePermissionTemplatePayload {
	name?: string
	defaultPermissions?: Record<string, string>
	version: number
}
