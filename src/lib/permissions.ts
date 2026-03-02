import { AppRole } from '@/domain/user'
import { ResourceType } from '@/domain/policy-assignment'
import { useAuth } from '@/contexts/auth'
import { useOrganization } from '@/contexts/organization'

export const Actions = {
	READ: 1,
	CREATE: 2,
	UPDATE: 4,
	DELETE: 8,
} as const

export const PermissionDomains = {
	PORTFOLIO: 'p',
	LEASES: 'l',
	MAINTENANCE: 'm',
	FINANCES: 'f',
	TENANTS: 't',
	ORGANIZATION: 'o',
} as const

/** Returns true if the bitmask includes the required action flag. */
export function hasAccess(userMask: number, requiredAction: number): boolean {
	return (userMask & requiredAction) !== 0
}

export type AccessEntry = {
	orgId: string
	scopeType: ResourceType
	scopeId: string
	permissions: Record<string, number>
}

/** Returns true if the access list grants the action on the given scope+domain. */
export function can(
	access: AccessEntry[],
	action: number,
	domain: string,
	scopeType: ResourceType,
	scopeId: string,
): boolean {
	if (access.length === 0) return false
	const entry = access.find(
		(e) => e.scopeType === scopeType && e.scopeId === scopeId,
	)
	if (!entry) return false
	return hasAccess(entry.permissions[domain] ?? 0, action)
}

/**
 * Hook for permission checks. ADMIN short-circuits to true (UX only — backend enforces via @PreAuthorize).
 * Defaults to ORG scope using activeOrgId when scopeId is omitted.
 * Returns false while user is loading or when required scopeId is missing.
 */
export function useCan(
	action: keyof typeof Actions,
	domain: keyof typeof PermissionDomains,
	scopeType: ResourceType = ResourceType.ORG,
	scopeId?: string,
): boolean {
	const { user } = useAuth()
	const { activeOrgId } = useOrganization()

	if (!user) return false

	if (user.roles.includes(AppRole.ADMIN)) return true

	let targetId = scopeId
	if (!targetId && scopeType === ResourceType.ORG) {
		targetId = activeOrgId ?? undefined
	}

	if (!targetId) return false

	return can(user.access, Actions[action], PermissionDomains[domain], scopeType, targetId)
}
