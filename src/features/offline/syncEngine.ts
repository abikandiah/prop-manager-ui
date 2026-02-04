import type { QueryClient } from '@tanstack/react-query'
import { db } from '@/features/offline/db'

let syncPromise: Promise<void> | null = null

export async function startSync(queryClient: QueryClient) {
	// If already syncing, the new mutation will be picked up
	// by the existing loop's next iteration.
	if (syncPromise) return syncPromise

	syncPromise = (async () => {
		try {
			await syncOutbox(queryClient)
		} finally {
			syncPromise = null
		}
	})()

	return syncPromise
}

export async function syncOutbox(queryClient: QueryClient) {
	const next = await db.getNextPending()
	if (!next) return

	// Find the 'live' mutation in the cache that matches this Dexie row
	let mutation = queryClient
		.getMutationCache()
		.getAll()
		.find((m) => m.mutationId.toString() === next.id)

	if (!mutation) {
		mutation = queryClient.getMutationCache().build(queryClient, {
			mutationKey: next.value.mutationKey,
			variables: next.value.variables,
		})
	}

	try {
		await mutation.execute(mutation.state.variables)
		await db.mutations.update(next.id, {
			status: 'synced',
			timestamp: Date.now(),
		})
	} catch (error) {
		// Fail after 3 retries
		const retryCount = (next.retryCount || 0) + 1
		if (retryCount >= 3) {
			await db.mutations.update(next.id, { status: 'failed', retryCount })
		} else {
			// Exponential backoff: delay next attempt
			const delay = Math.pow(2, retryCount) * 1000
			await db.mutations.update(next.id, {
				retryCount,
				timestamp: Date.now() + delay,
			})
		}
	}

	// Process next mutation
	syncOutbox(queryClient)
}
