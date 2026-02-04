import { onlineManager } from '@tanstack/react-query'
import { config } from '@/config'
import {
	createContext,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react'

/**
 * Network status context for offline-first UX.
 * Uses the standard browser APIs: navigator.onLine and the online/offline events.
 * Keeps TanStack Query's onlineManager in sync so queries pause when offline.
 * getIsOnline() is for non-React code that needs the current value without subscribing.
 */
interface NetworkContextValue {
	isOnline: boolean
}

const NetworkContext = createContext<NetworkContextValue | null>(null)

let isOnlineRef = true

export function getIsOnline(): boolean {
	return isOnlineRef
}

export function NetworkProvider({ children }: { children: React.ReactNode }) {
	const [isOnline, setIsOnline] = useState(navigator.onLine)
	const abortControllerRef = useRef<AbortController | null>(null)

	useEffect(() => {
		async function updateOnline(value: boolean) {
			// Cancel previous fetch if still running
			abortControllerRef.current?.abort()
			abortControllerRef.current = new AbortController()

			let actualOnline = value

			// If the browser says we are online, double-check with a tiny fetch
			if (value) {
				try {
					// Check if browser is actually online with test request
					await fetch(
						`${config.apiBaseUrl.replace(/\/$/, '')}/actuator/health`,
						{
							signal: abortControllerRef.current.signal,
						},
					)
					actualOnline = true
				} catch (err: any) {
					if (err.name === 'AbortError') return
					actualOnline = false // It's "Lie-Fi"
				}
			}

			isOnlineRef = actualOnline
			setIsOnline(actualOnline)
			onlineManager.setOnline(actualOnline)
		}

		updateOnline(navigator.onLine)

		const handleOnline = () => updateOnline(true)
		const handleOffline = () => updateOnline(false)

		window.addEventListener('online', handleOnline)
		window.addEventListener('offline', handleOffline)
		return () => {
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
