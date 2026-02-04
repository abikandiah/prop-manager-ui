import {
	createContext,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react'
import { onlineManager, useQueryClient } from '@tanstack/react-query'
import { config } from '@/config'
import { startSync } from '@/features/offline/syncEngine'

/**
 * Network status context for offline-first UX.
 * Uses the standard browser APIs: navigator.onLine and the online/offline events.
 * Keeps TanStack Query's onlineManager in sync so queries pause when offline.
 */
interface NetworkContextValue {
	isOnline: boolean
}

const NetworkContext = createContext<NetworkContextValue | null>(null)

export function NetworkProvider({ children }: { children: React.ReactNode }) {
	const [isOnline, setIsOnline] = useState(navigator.onLine)
	const abortControllerRef = useRef<AbortController | null>(null)
	const queryClient = useQueryClient()

	useEffect(() => {
		async function updateOnline(value: boolean) {
			// Cancel previous fetch if still running
			abortControllerRef.current?.abort()
			abortControllerRef.current = new AbortController()

			let actualOnline = value

			// If the browser says we are online, double-check with a tiny fetch
			if (value) {
				try {
					await fetch(
						`${config.apiBaseUrl.replace(/\/$/, '')}/actuator/health`,
						{
							method: 'HEAD',
							cache: 'no-store',
							signal: abortControllerRef.current.signal,
						},
					)
					actualOnline = true
				} catch (err: any) {
					if (err.name === 'AbortError') return
					actualOnline = false // It's "Lie-Fi"
				}
			}

			setIsOnline(actualOnline)
			onlineManager.setOnline(actualOnline)

			if (actualOnline) {
				startSync(queryClient)
			}
		}

		updateOnline(navigator.onLine)

		const handleOnline = () => updateOnline(true)
		const handleOffline = () => updateOnline(false)

		window.addEventListener('online', handleOnline)
		window.addEventListener('offline', handleOffline)
		return () => {
			abortControllerRef.current?.abort()
			window.removeEventListener('online', handleOnline)
			window.removeEventListener('offline', handleOffline)
		}
	}, [])

	const value = useMemo<NetworkContextValue>(() => ({ isOnline }), [isOnline])

	return (
		<NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>
	)
}

export function useNetwork() {
	const ctx = useContext(NetworkContext)
	if (!ctx) throw new Error('useNetwork must be used within NetworkProvider')
	return ctx
}

// Force TanStack Query to wait for our manual .setOnline() calls
onlineManager.setEventListener(() => {
	return () => {}
})
