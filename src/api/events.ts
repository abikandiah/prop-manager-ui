import { useEffect, useRef } from 'react'

export type ApiEvent = 'api-success' | 'api-failure' | 'api-unauthorized'

// Pre-initialized so emit needs no null-guard and TypeScript enforces exhaustiveness
const listeners: Record<ApiEvent, Set<() => void>> = {
	'api-success': new Set(),
	'api-failure': new Set(),
	'api-unauthorized': new Set(),
}

/** Emit an API lifecycle event to all registered listeners. */
export function emitApiEvent(event: ApiEvent): void {
	listeners[event].forEach((fn) => {
		try {
			fn()
		} catch (e) {
			console.error('[ApiEvent] Listener error:', e)
		}
	})
}

/** Subscribe to an API lifecycle event. Returns an unsubscribe function. */
export function onApiEvent(event: ApiEvent, listener: () => void): () => void {
	listeners[event].add(listener)
	return () => listeners[event].delete(listener)
}

/**
 * React hook that subscribes to an API lifecycle event for the component lifetime.
 * Uses the latest-ref pattern — the listener is never stale and the subscription
 * is only registered once per event type.
 */
export function useApiEvent(event: ApiEvent, listener: () => void): void {
	const listenerRef = useRef(listener)
	// Keep ref current without triggering re-subscription
	useEffect(() => {
		listenerRef.current = listener
	})

	useEffect(() => {
		return onApiEvent(event, () => listenerRef.current())
	}, [event])
}
