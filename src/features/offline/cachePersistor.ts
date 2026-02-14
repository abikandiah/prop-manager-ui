import { getDb } from './db'
import type {
	PersistedClient,
	Persister,
} from '@tanstack/react-query-persist-client'

function throttle<T extends (client: PersistedClient) => void>(
	fn: T,
	delay: number,
	opts: { leading?: boolean; trailing?: boolean } = {},
): T {
	const { leading = true, trailing = true } = opts
	let lastRun = 0
	let timeoutId: ReturnType<typeof setTimeout> | null = null
	let lastArgs: PersistedClient | null = null

	const invoke = (client: PersistedClient) => {
		lastArgs = null
		lastRun = Date.now()
		void fn(client)
	}

	return ((client: PersistedClient) => {
		const now = Date.now()
		if (leading && now - lastRun >= delay) {
			invoke(client)
		} else if (trailing) {
			lastArgs = client
			if (timeoutId === null) {
				timeoutId = setTimeout(() => {
					timeoutId = null
					if (lastArgs) invoke(lastArgs)
				}, delay)
			}
		}
	}) as T
}

/**
 * Create a user-scoped cache persister for TanStack Query.
 * Throttles writes to IndexedDB to avoid excessive disk I/O.
 *
 * @param userId - User ID for database scoping
 * @param throttleMs - Throttle delay in milliseconds (default: 1000ms)
 */
export const createThrottledCachePersister = (
	userId: string,
	throttleMs = 1000,
): Persister => {
	const db = getDb(userId)

	const saveToDisk = async (client: PersistedClient) => {
		try {
			console.log('[Cache] Persisting to IndexedDB for user:', userId)
			await db.saveCacheBlob(client)
		} catch (err) {
			console.error('[Cache] Failed to persist:', err)

			// Handle quota exceeded
			if (err instanceof Error && err.name === 'QuotaExceededError') {
				console.error(
					'[Cache] Storage quota exceeded! Consider clearing old data.',
				)
				// TODO: Show user warning toast
			}
		}
	}

	const throttledSave = throttle(saveToDisk, throttleMs, {
		leading: true,
		trailing: true,
	})

	return {
		persistClient: (client: PersistedClient) => {
			throttledSave(client)
		},
		restoreClient: async () => {
			try {
				const cache = await db.loadCacheBlob()
				if (!cache) {
					console.log('[Cache] No cached data found for user:', userId)
					return undefined
				}

				// Structural validation
				if (!cache.timestamp || !cache.clientState) {
					console.warn('[Cache] Invalid cache structure, ignoring')
					return undefined
				}

				console.log('[Cache] Restored from IndexedDB for user:', userId)
				return cache
			} catch (error) {
				console.error('[Cache] Failed to restore:', error)
				return undefined
			}
		},
		removeClient: async () => {
			console.log('[Cache] Removing cache for user:', userId)
			return await db.deleteCacheBlob()
		},
	}
}
