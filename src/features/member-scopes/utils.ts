import type { PermissionTemplate } from '@/domain/permission-template'
import type { ScopeType } from '@/domain/member-scope'

/** Sorts permission action characters to produce a canonical form (e.g. "cr" → "cr", "rc" → "cr"). */
export const normalizePermString = (s: string) => s.split('').sort().join('')

/**
 * Extracts permissions for a specific scope type from a permission template.
 * This effectively "flattens" the template into a simple permission map for that scope.
 */
export function getTemplatePermissions(
	template: PermissionTemplate | undefined,
	scopeType: ScopeType,
): Record<string, string> {
	if (!template) return {}
	return (
		template.items.find((i) => i.scopeType === scopeType)?.permissions ?? {}
	)
}
