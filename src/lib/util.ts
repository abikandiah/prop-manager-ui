import { v7 as uuidv7 } from 'uuid'

export function nowIso(): string {
	return new Date().toISOString()
}

/**
 * Generate a client-side UUID for new entities.
 * Use this for all create operations to ensure idempotency.
 */
export function generateId(): string {
	return crypto.randomUUID()
}

/**
 * @deprecated Use generateId() instead
 */
export function generateOptimisticId(): string {
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
