import type {
	PersistedClient,
	Persister,
} from '@tanstack/react-query-persist-client'
import type { DehydratedState } from '@tanstack/react-query'
import type { MutationOutboxStatus } from '@/lib/db'
import { db } from '@/lib/db'
import type { DehydratedMutation } from './offline-types'
import { stableMutationId } from './offline-types'

function outboxStatusFromMutation(m: DehydratedMutation): MutationOutboxStatus {
	const status = m.state?.status
	if (status === 'success') return 'synced'
	if (status === 'error') return 'failed'
	return 'pending'
}

const METADATA_KEY = 'client-metadata'

/**
 * Granular IndexedDB persister using Dexie.
 * - Queries: clear + bulkPut (cache is safe to overwrite).
 * - Mutations: merge-only (put per row). Never clear() — avoids losing the outbox
 *   if the app crashes between clear and bulkPut.
 */
export function createQueryCachePersister(): Persister {
	return {
		persistClient: async (client: PersistedClient) => {
			const { timestamp, buster, clientState } = client
			const now = Date.now()

			await db.transaction('rw', [db.queries, db.mutations, db.metadata], async () => {
				// 1. Save metadata
				await db.metadata.put({ key: METADATA_KEY, value: { timestamp, buster } })

				// 2. Queries: overwrite is safe (they are just a cache)
				await db.queries.clear()
				await db.queries.bulkPut(
					clientState.queries.map((q) => ({
						queryKey: JSON.stringify(q.queryKey),
						value: q,
					})),
				)

				// 3. Mutations: differential upsert only. Never clear() — preserves rows
				// if the process dies between clear and bulkPut.
				for (const m of clientState.mutations as DehydratedMutation[]) {
					await db.mutations.put({
						id: stableMutationId(m),
						value: m,
						status: outboxStatusFromMutation(m),
						timestamp: now,
					})
				}
			})
		},

		restoreClient: async () => {
			const meta = await db.metadata.get(METADATA_KEY)
			if (!meta) return undefined

			const queries = await db.queries.toArray()
			const mutations = await db.mutations.toArray()

			return {
				...(meta.value as { timestamp: number; buster: string }),
				clientState: {
					queries: queries.map((row) => row.value),
					mutations: mutations.map((row) => row.value),
				} as DehydratedState,
			} as PersistedClient
		},

		removeClient: async () => {
			await db.transaction('rw', [db.queries, db.mutations, db.metadata], async () => {
				await db.queries.clear()
				await db.mutations.clear()
				await db.metadata.clear()
			})
		},
	}
}
