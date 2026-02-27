import { v7 as uuidv7 } from 'uuid'

export function nowIso(): string {
	return new Date().toISOString()
}

/**
 * Generate a client-side UUID v7 for new entities.
 * UUID v7 is time-sortable and monotonically increasing, matching the backend's
 * ID generation strategy. Use this for all create operations to ensure
 * idempotency and stable optimistic IDs.
 */
export function generateId(): string {
	return uuidv7()
}

/**
 * Trim a string; return undefined if the result is empty.
 * Useful for optional form fields that should become undefined when blank.
 */
export function trimOrUndefined(s: string): string | undefined {
	const t = s.trim()
	return t === '' ? undefined : t
}

/**
 * Parse a string as a float; return undefined if the string is empty or only whitespace.
 */
export function parseFloatOrUndefined(s: string): number | undefined {
	const t = s.trim()
	return t === '' ? undefined : parseFloat(t)
}

/**
 * Parse a string as an integer with the given radix; return undefined if the string is empty or only whitespace.
 */
export function parseIntOrUndefined(
	s: string,
	radix: number,
): number | undefined {
	const t = s.trim()
	return t === '' ? undefined : parseInt(t, radix)
}

/**
 * Shallow equality for two records (same keys, same values via ===).
 * Use when you need to avoid syncing when the parent echoes our own update.
 *
 * @param a - First record
 * @param b - Second record
 * @returns true if both have the same keys and each value is === equal
 */
export function recordsShallowEqual(
	a: Record<string, string>,
	b: Record<string, string>,
): boolean {
	const keysA = Object.keys(a)
	const keysB = Object.keys(b)
	if (keysA.length !== keysB.length) return false
	return keysA.every((k) => b[k] === a[k])
}

/**
 * Normalize a template parameter name for use in placeholders like {{ parameter_name }}.
 * Strips surrounding {{ }}, trims, replaces spaces with underscores, and keeps only alphanumerics and underscores.
 *
 * @param raw - User input (e.g. "{{ my param }}", "my param", "my-param")
 * @returns Normalized key suitable for template substitution (e.g. "my_param")
 */
export function normalizeParameterName(raw: string): string {
	let s = raw.replace(/^\{\{|\}\}$/g, '').trim()
	s = s.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')
	return s
}
