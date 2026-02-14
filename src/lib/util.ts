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
