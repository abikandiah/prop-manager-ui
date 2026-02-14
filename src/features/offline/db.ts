import Dexie from 'dexie'
import type { PersistedClient } from '@tanstack/react-query-persist-client'

const CACHE_KEY = 'react-query-cache'

/**
 * User-scoped IndexedDB database for offline caching.
 * Each user gets their own isolated database for privacy and security.
 *
 * Pure TanStack Query approach:
 * - TanStack handles mutation persistence internally
 * - No custom mutation outbox needed
 * - Simpler, more reliable
 */
export class AppDatabase extends Dexie {
	queries!: Dexie.Table<
		{ id: string; value: PersistedClient; updatedAt: number },
		string
	>

	constructor(userId: string) {
		// User-scoped database name for privacy/security
		super(`prop-manager-db-${userId}`)

		this.version(1).stores({
			queries: 'id, updatedAt',
		})
	}

	async saveCacheBlob(client: PersistedClient) {
		return this.queries.put({
			id: CACHE_KEY,
			value: client,
			updatedAt: Date.now(),
		})
	}

	async loadCacheBlob() {
		const record = await this.queries.get(CACHE_KEY)
		return record?.value
	}

	async deleteCacheBlob() {
		await this.queries.delete(CACHE_KEY)
	}
}

// Singleton management for user-scoped databases
let currentDb: AppDatabase | null = null
let currentUserId: string | null = null

/**
 * Get the database for a specific user.
 * Manages singleton to avoid creating multiple database instances.
 */
export function getDb(userId: string): AppDatabase {
	if (currentDb && currentUserId === userId) {
		return currentDb
	}

	// Close old database if switching users
	if (currentDb) {
		console.log('[DB] Closing database for user:', currentUserId)
		currentDb.close()
	}

	console.log('[DB] Opening database for user:', userId)
	currentDb = new AppDatabase(userId)
	currentUserId = userId
	return currentDb
}

/**
 * Clear all offline data for a specific user.
 * Called on logout to ensure data privacy.
 */
export async function clearUserDb(userId: string) {
	const dbName = `prop-manager-db-${userId}`
	console.log('[DB] Clearing database for user:', userId)

	try {
		await Dexie.delete(dbName)
		console.log('[DB] Database cleared successfully')
	} catch (error) {
		console.error('[DB] Failed to clear database:', error)
	}

	// Clear singleton if it's the current user
	if (currentUserId === userId) {
		currentDb = null
		currentUserId = null
	}
}
