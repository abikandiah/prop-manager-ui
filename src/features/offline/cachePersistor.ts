import { db } from './db'
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

export const createThrottledCachePersister = (throttleMs = 1000): Persister => {
	const saveToDisk = async (client: PersistedClient) => {
		try {
			console.log('Persisting TanStack cache to Dexie...')
			await db.saveCacheBlob(client)
		} catch (err) {
			console.error('Failed to persist TanStack cache:', err)
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
				if (!cache) return undefined

				// Structural validation
				if (!cache.timestamp || !cache.clientState) {
					console.warn('Persisted cache is invalid, ignoring.')
					return undefined
				}
				return cache
			} catch (error) {
				console.error('Failed to restore cache:', error)
				return undefined
			}
		},
		removeClient: async () => {
			return await db.deleteCacheBlob()
		},
	}
}
