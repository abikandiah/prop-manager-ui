export type ResourceType = 'ORG' | 'PROPERTY' | 'UNIT'

export interface PolicyAssignment {
	id: string
	membershipId: string
	resourceType: ResourceType
	/** For ORG scope, this is the org ID. For PROPERTY, the property ID. For UNIT, the unit ID. */
	resourceId: string
	/** Optional policy reference — null for purely custom (overrides-only) assignments. */
	policyId: string | null
	/** Optional custom overrides — when present, takes precedence over the policy permissions. */
	overrides: Record<string, string> | null
	version: number
	createdAt: string
	updatedAt: string
}

export interface CreatePolicyAssignmentPayload {
	id: string
	resourceType: ResourceType
	resourceId: string
	policyId?: string | null
	overrides?: Record<string, string> | null
}

export interface UpdatePolicyAssignmentPayload {
	policyId?: string | null
	overrides?: Record<string, string> | null
	version: number
}

/** UI shape for defining a single assignment during creation (invite form, add-assignment dialog). */
export type AssignmentConfigValue = {
	resourceType: ResourceType
	resourceId: string
	usePolicy: boolean
	policyId?: string
	overrides: Record<string, string>
}
