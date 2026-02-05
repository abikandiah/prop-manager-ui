import { v5 as uuidv5 } from 'uuid'
import type { DehydratedState } from '@tanstack/react-query'

/**
 * A fixed namespace UUID for deterministic generation across the app.
 * Generated once and must remain constant.
 */
const APP_NAMESPACE = '1b671a64-40d5-491e-99b0-da01ff1f3341'

/**
 * TanStack dehydrates each mutation to an object with:
 * - mutationKey: identifies the mutation (e.g. ['createProp'])
 * - state: { status, isPaused, variables, ... } — status is 'idle' | 'pending' | 'success' | 'error'
 * - meta, scope: optional
 */
export type DehydratedMutation = DehydratedState['mutations'][number]

/** Statuses that indicate the mutation is waiting to be sent (resumable when back online). */
export const RESUMABLE_MUTATION_STATUSES = ['idle', 'pending'] as const

export type ResumableMutationStatus =
	(typeof RESUMABLE_MUTATION_STATUSES)[number]

export function isResumableMutation(
	m: DehydratedMutation | null | undefined,
): boolean {
	if (!m?.state) return false
	const status = m.state.status
	return status === 'idle' || status === 'pending'
}

/** Stable id for a DehydratedMutation so we can upsert by id and never rely on clear(). */
export function stableMutationId(m: DehydratedMutation): string {
	const submittedAt = m.state.submittedAt
	const payload = JSON.stringify({
		k: m.mutationKey,
		v: m.state.variables,
	})
	// Use a short version of the UUID for the local DB ID
	const hash = uuidv5(payload, APP_NAMESPACE).split('-')[0]
	return `m-${submittedAt}-${hash}`
}

/**
 * Deterministic request ID from mutation key + variables for X-Request-Id.
 * Same logical mutation (e.g. same payload on resume) gets the same ID so the backend can dedupe.
 */
export function stableRequestId(
	mutationKey: unknown,
	variables: unknown,
): string {
	const payload = JSON.stringify({ k: mutationKey, v: variables })
	return uuidv5(payload, APP_NAMESPACE)
}
