import type { QueryClient } from '@tanstack/react-query'
import { db } from '@/lib/db'
import { isResumableMutation } from '@/lib/offline-types'

/**
 * Status-aware sync: only calls resumePausedMutations when Dexie actually
 * has mutations in a resumable state (idle or pending). Avoids no-op work
 * and makes it easy to add logging or UI (e.g. "Syncing 2 changes…").
 */
export async function smartSync(queryClient: QueryClient): Promise<{
	resumed: boolean
	pendingCount: number
}> {
	const rows = await db.mutations.toArray()
	const pending = rows.filter((row) => {
		const status = row.status ?? 'pending'
		return status === 'pending' && row.value != null && isResumableMutation(row.value)
	})

	if (pending.length === 0) {
		return { resumed: false, pendingCount: 0 }
	}

	await queryClient.resumePausedMutations()
	return { resumed: true, pendingCount: pending.length }
}
