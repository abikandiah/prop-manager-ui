import type { ReactNode } from 'react'
import { useDelayedLoading } from '@/hooks/useDelayedLoading'

export interface DelayedLoadingFallbackProps {
	/** When true, shows fallback after delay (or nothing during delay). */
	isLoading: boolean
	/** Delay in ms before showing fallback. Default from config (VITE_LOADING_FALLBACK_DELAY_MS). */
	delayMs?: number
	/** Shown after delay while loading (e.g. skeleton or spinner). */
	fallback: ReactNode
	/** Shown when not loading. */
	children: ReactNode
}

/**
 * Avoids flashing loading UI on fast loads: shows nothing for the first delayMs,
 * then fallback; when loading ends, shows children immediately.
 */
export function DelayedLoadingFallback({
	isLoading,
	delayMs,
	fallback,
	children,
}: DelayedLoadingFallbackProps) {
	const showFallback = useDelayedLoading(isLoading, delayMs)
	if (isLoading) {
		return showFallback ? <>{fallback}</> : null
	}
	return <>{children}</>
}
