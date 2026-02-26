/**
 * Bitwise action flags for permission checks.
 * Combine with bitwise OR to represent multiple permissions.
 */
export const Actions = {
	READ: 1,
	CREATE: 2,
	UPDATE: 4,
	DELETE: 8,
} as const

/**
 * Short domain keys used as permission map keys in access entries.
 */
export const PermissionDomains = {
	PORTFOLIO: 'p',
	LEASES: 'l',
	MAINTENANCE: 'm',
	FINANCES: 'f',
	TENANTS: 't',
	ORGANIZATION: 'o',
} as const

/**
 * Check whether a user's permission mask includes the required action.
 *
 * @param userMask - Bitmask of actions granted to the user for a given domain
 * @param requiredAction - The action flag to test (from Actions)
 * @returns true if the user has the required action
 */
export function hasAccess(userMask: number, requiredAction: number): boolean {
	return (userMask & requiredAction) !== 0
}

/**
 * A single access grant scoped to an org, property, or unit.
 * Contains per-domain permission bitmasks.
 */
export type AccessEntry = {
	orgId: string
	scopeType: 'ORG' | 'PROPERTY' | 'UNIT'
	scopeId: string
	permissions: Record<string, number>
}

/**
 * Decode the `access` claim from the JWT stored in localStorage.
 * Returns an empty array if the token is absent, the claim is missing,
 * or decoding fails for any reason.
 *
 * In production (OIDC), the access claim is hydrated server-side and
 * will not be present in the JWT — returning an empty array is correct.
 *
 * @returns Array of AccessEntry objects extracted from the JWT payload
 */
export function usePermissions(): AccessEntry[] {
	try {
		const token = localStorage.getItem('DEV_AUTH_TOKEN')
		if (!token) return []
		const [, payload] = token.split('.')
		const decoded = JSON.parse(
			atob(payload.replace(/-/g, '+').replace(/_/g, '/')),
		)
		const access = decoded?.access
		if (!Array.isArray(access)) return []
		return access as AccessEntry[]
	} catch {
		return []
	}
}

/**
 * Check whether the given access list permits an action on a specific scope and domain.
 *
 * @param access - Access entries returned by usePermissions()
 * @param action - The action flag to test (from Actions)
 * @param domain - The permission domain key (from PermissionDomains)
 * @param scopeType - The scope type to match ('ORG' | 'PROPERTY' | 'UNIT')
 * @param scopeId - The scope ID to match
 * @returns true if a matching entry exists and grants the required action for the domain
 */
export function can(
	access: AccessEntry[],
	action: number,
	domain: string,
	scopeType: string,
	scopeId: string,
): boolean {
	if (access.length === 0) return false
	const entry = access.find(
		(e) => e.scopeType === scopeType && e.scopeId === scopeId,
	)
	if (!entry) return false
	return hasAccess(entry.permissions[domain] ?? 0, action)
}
