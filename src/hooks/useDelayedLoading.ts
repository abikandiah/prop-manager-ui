import { useEffect, useState } from 'react'
import { config } from '@/config'

/**
 * Returns true only after `loading` has been true for at least `delayMs`.
 * When `loading` goes false, the returned value goes false immediately (no delay on hide).
 * Avoids flashing skeletons/spinners on fast navigations or cached data.
 * Uses config.loadingFallbackDelayMs when delayMs is not passed (overridable via VITE_LOADING_FALLBACK_DELAY_MS).
 */
export function useDelayedLoading(
	loading: boolean,
	delayMs?: number,
): boolean {
	const delay = delayMs ?? config.loadingFallbackDelayMs
	const [showLoading, setShowLoading] = useState(false)

	useEffect(() => {
		if (!loading) {
			setShowLoading(false)
			return
		}
		const id = window.setTimeout(() => setShowLoading(true), delay)
		return () => window.clearTimeout(id)
	}, [loading, delay])

	return showLoading
}
