import { useOrganization } from '@/contexts/organization'
import { ResourceType } from '@/domain/policy-assignment'
import { AppRole } from '@/domain/user'
import { useAuth } from '@/features/auth'

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
	PEOPLE: 'c',
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

type ScopeStep = { scopeType: ResourceType; scopeId: string }

/**
 * Walks the scope chain with first-match-wins semantics (mirrors backend HierarchyAwareAuthorizationService).
 * The first scope level that has an assignment entry determines the result — no fallback once an entry is found.
 */
function canWithChain(
	access: AccessEntry[],
	action: number,
	domain: string,
	chain: ScopeStep[],
): boolean {
	if (access.length === 0) return false
	for (const scope of chain) {
		const entry = access.find(
			(e) => e.scopeType === scope.scopeType && e.scopeId === scope.scopeId,
		)
		if (entry !== undefined) {
			return hasAccess(entry.permissions[domain] ?? 0, action)
		}
	}
	return false
}

/**
 * Hook for permission checks. ADMIN short-circuits to true (UX only — backend enforces via @PreAuthorize).
 *
 * Implements hierarchy: UNIT → PROPERTY → ORG (first-match-wins, mirrors backend).
 * - UNIT scope: chain is [(UNIT, scopeId), (PROPERTY, parentScopeId), (ORG, activeOrgId)]
 * - PROPERTY scope: chain is [(PROPERTY, scopeId), (ORG, activeOrgId)]
 * - ORG scope: chain is [(ORG, activeOrgId)]
 *
 * @param scopeId - The resource ID. Ignored when scopeType is ORG (activeOrgId is always used).
 * @param parentScopeId - The parent property ID when scopeType is UNIT.
 */
export function useCan(
	action: keyof typeof Actions,
	domain: keyof typeof PermissionDomains,
	scopeType: ResourceType = ResourceType.ORG,
	scopeId?: string,
	parentScopeId?: string,
): boolean {
	const { user } = useAuth()
	const { activeOrgId } = useOrganization()

	if (!user) return false

	if (user.roles.includes(AppRole.ADMIN)) return true

	const orgStep: ScopeStep | null = activeOrgId
		? { scopeType: ResourceType.ORG, scopeId: activeOrgId }
		: null

	const chain: ScopeStep[] = []

	if (scopeType !== ResourceType.ORG && scopeId) {
		chain.push({ scopeType, scopeId })
	}

	if (scopeType === ResourceType.UNIT && parentScopeId) {
		chain.push({ scopeType: ResourceType.PROPERTY, scopeId: parentScopeId })
	}

	if (orgStep) {
		chain.push(orgStep)
	}

	if (chain.length === 0) return false

	return canWithChain(
		user.access,
		Actions[action],
		PermissionDomains[domain],
		chain,
	)
}
