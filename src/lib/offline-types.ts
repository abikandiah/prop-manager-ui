import type { DehydratedState } from '@tanstack/react-query'

/**
 * TanStack dehydrates each mutation to an object with:
 * - mutationKey: identifies the mutation (e.g. ['createProp'])
 * - state: { status, isPaused, variables, ... } — status is 'idle' | 'pending' | 'success' | 'error'
 * - meta, scope: optional
 */
export type DehydratedMutation = DehydratedState['mutations'][number]

/** Statuses that indicate the mutation is waiting to be sent (resumable when back online). */
export const RESUMABLE_MUTATION_STATUSES = ['idle', 'pending'] as const

export type ResumableMutationStatus = (typeof RESUMABLE_MUTATION_STATUSES)[number]

export function isResumableMutation(m: DehydratedMutation | null | undefined): boolean {
	if (!m?.state) return false
	const status = m.state.status
	return status === 'idle' || status === 'pending'
}

/** Stable id for a DehydratedMutation so we can upsert by id and never rely on clear(). */
export function stableMutationId(m: DehydratedMutation): string {
	const submittedAt = m.state?.submittedAt ?? 0
	const payload = JSON.stringify({
		k: m.mutationKey,
		v: m.state?.variables,
	})
	let h = 5381
	for (let i = 0; i < payload.length; i++) h = (h * 33) ^ payload.charCodeAt(i)
	const hash = (h >>> 0).toString(36)
	return `m-${submittedAt}-${hash}`
}

/**
 * Deterministic request ID from mutation key + variables for X-Request-Id.
 * Same logical mutation (e.g. same payload on resume) gets the same ID so the backend can dedupe.
 */
export function stableRequestId(mutationKey: unknown, variables: unknown): string {
	const payload = JSON.stringify({ k: mutationKey, v: variables })
	let h = 5381
	for (let i = 0; i < payload.length; i++) h = (h * 33) ^ payload.charCodeAt(i)
	const a = (h >>> 0).toString(16).padStart(8, '0').slice(-8)
	const b = ((h * 31) >>> 0).toString(16).padStart(8, '0').slice(-8)
	const c = ((h * 17) >>> 0).toString(16).padStart(8, '0').slice(-8)
	const d = ((h * 7) >>> 0).toString(16).padStart(8, '0').slice(-4)
	const e = ((h * 13) >>> 0).toString(16).padStart(8, '0').slice(-8) + d
	return `${a}-${b.slice(0, 4)}-4${b.slice(4, 8)}-a${c.slice(0, 3)}-${c.slice(3)}${e.slice(0, 7)}`
}
