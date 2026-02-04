import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { useNetwork } from '@/contexts/network'
import { smartSync } from '@/offline/smartSync'

/**
 * When the app comes back online, runs status-aware sync: reads pending mutations
 * from Dexie (DehydratedMutation with state.status idle/pending) and only then
 * calls resumePausedMutations so TanStack re-runs them.
 * Renders nothing; mount inside QueryClientProvider and NetworkProvider.
 */
export function SyncOnReconnect() {
	const queryClient = useQueryClient()
	const { isOnline } = useNetwork()
	const wasOffline = useRef(false)
	const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

	useEffect(() => {
		if (syncTimerRef.current) {
			clearTimeout(syncTimerRef.current)
		}

		if (isOnline && wasOffline.current) {
			syncTimerRef.current = setTimeout(async () => {
				const { resumed, pendingCount } = await smartSync(queryClient)
				if (resumed && pendingCount > 0) {
					// Optional: could surface to UI (e.g. toast "Synced N changes")
				}
				wasOffline.current = false
			}, 2000)
		} else if (!isOnline) {
			wasOffline.current = true
		}

		return () => {
			if (syncTimerRef.current) clearTimeout(syncTimerRef.current)
		}
	}, [isOnline, queryClient])

	return null
}
