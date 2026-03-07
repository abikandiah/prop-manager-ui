import { useApiEvent } from '@/api/events'
import { config } from '@/config'
import { onlineManager } from '@tanstack/react-query'
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
 *
 * Tracks both:
 * 1. Browser network connectivity (navigator.onLine) - INSTANT detection
 * 2. API server reachability (health check + failed request detection) - Uses failure threshold
 *
 * The app is considered "online" only when BOTH network AND server are available.
 *
 * Only one instance of this provider should exist (main.tsx).
 * User-scoped mutation resumption is handled in AppWithProviders (_auth.tsx).
 */
interface NetworkContextValue {
	isOnline: boolean // Combined: network AND server must be reachable
	isServerReachable: boolean // Server health (uses failure threshold)
	consecutiveFailures: number // Count of consecutive server errors
}

const NetworkContext = createContext<NetworkContextValue | null>(null)

// Thresholds for SERVER reachability only (network connectivity is instant)
const MAX_FAILURES_BEFORE_OFFLINE = 3 // Server: 3 consecutive failures → mark unreachable
const HEALTH_CHECK_INTERVAL_MS = 30000 // Poll server every 30s when unreachable

export function NetworkProvider({ children }: { children: React.ReactNode }) {
	const [isNetworkOnline, setIsNetworkOnline] = useState(navigator.onLine)
	const [isServerReachable, setIsServerReachable] = useState(true)
	const [consecutiveFailures, setConsecutiveFailures] = useState(0)

	const abortControllerRef = useRef<AbortController | null>(null)
	const healthCheckIntervalRef = useRef<NodeJS.Timeout | null>(null)

	// Combined online status: network AND server must be reachable
	const isOnline = isNetworkOnline && isServerReachable

	/**
	 * Check if the API server is reachable
	 */
	const checkServerHealth = async (): Promise<boolean | undefined> => {
		try {
			abortControllerRef.current?.abort()
			abortControllerRef.current = new AbortController()

			// Strip /api suffix so we hit /actuator/health, not /api/actuator/health
			const response = await fetch(`${config.apiBaseUrl}/actuator/health`, {
				method: 'HEAD',
				cache: 'no-store',
				signal: abortControllerRef.current.signal,
			})

			if (!response.ok) {
				console.warn('[Network] Server health check failed:', response.status)
				return false
			}

			console.log('[Network] Server is reachable')
			return true
		} catch (err: unknown) {
			if (err instanceof Error && err.name === 'AbortError') {
				return undefined // Aborted, don't change state
			}

			console.warn('[Network] Server unreachable:', err)
			return false
		}
	}

	/**
	 * Handle network connectivity changes (INSTANT, no threshold)
	 * Browser network events are reliable (WiFi on/off, airplane mode, etc.)
	 */
	useEffect(() => {
		async function updateNetworkStatus(value: boolean) {
			// Update network status immediately (no threshold)
			setIsNetworkOnline(value)

			if (value) {
				// Network came back, check if server is reachable
				const serverOk = await checkServerHealth()
				if (serverOk != undefined) {
					setIsServerReachable(serverOk)
				}

				if (serverOk) {
					setConsecutiveFailures(0)
				}
			} else {
				// Network offline → server is unreachable too
				setIsServerReachable(false)
			}
		}

		updateNetworkStatus(navigator.onLine)

		const handleOnline = () => updateNetworkStatus(true)
		const handleOffline = () => updateNetworkStatus(false)

		window.addEventListener('online', handleOnline)
		window.addEventListener('offline', handleOffline)

		return () => {
			window.removeEventListener('online', handleOnline)
			window.removeEventListener('offline', handleOffline)
		}
	}, [])

	/**
	 * Periodic health check when server is unreachable
	 */
	useEffect(() => {
		// Clear existing interval
		if (healthCheckIntervalRef.current) {
			clearInterval(healthCheckIntervalRef.current)
			healthCheckIntervalRef.current = null
		}

		// Only poll if network is online but server is unreachable
		if (isNetworkOnline && !isServerReachable) {
			console.log('[Network] Starting periodic health checks...')

			healthCheckIntervalRef.current = setInterval(async () => {
				console.log('[Network] Checking server health...')
				const serverOk = await checkServerHealth()

				if (serverOk) {
					setIsServerReachable(true)
					setConsecutiveFailures(0)
					console.log('[Network] Server is back online!')
				}
			}, HEALTH_CHECK_INTERVAL_MS)
		}

		return () => {
			if (healthCheckIntervalRef.current) {
				clearInterval(healthCheckIntervalRef.current)
			}
		}
	}, [isNetworkOnline, isServerReachable])

	/**
	 * Sync TanStack Query's onlineManager with our combined status.
	 * Each QueryClient subscribed to onlineManager will auto-resume its paused mutations.
	 */
	useEffect(() => {
		onlineManager.setOnline(isOnline)
		if (isOnline) {
			console.log('[Network] App is online')
		} else {
			console.log('[Network] App is offline, mutations will pause')
		}
	}, [isOnline])

	// Subscribe to Axios lifecycle events — functional updaters prevent stale closures
	useApiEvent('api-success', () => {
		setConsecutiveFailures(0)
		setIsServerReachable(true)
	})

	useApiEvent('api-failure', () => {
		setConsecutiveFailures((prev) => {
			const next = prev + 1
			if (next >= MAX_FAILURES_BEFORE_OFFLINE) {
				console.warn(
					`[Network] ${next} consecutive server failures, marking as unreachable`,
				)
				setIsServerReachable(false)
			}
			return next
		})
	})

	useEffect(() => {
		return () => {
			abortControllerRef.current?.abort()
			if (healthCheckIntervalRef.current) {
				clearInterval(healthCheckIntervalRef.current)
			}
		}
	}, [])

	const value = useMemo<NetworkContextValue>(
		() => ({
			isOnline,
			isServerReachable,
			consecutiveFailures,
		}),
		[isOnline, isServerReachable, consecutiveFailures],
	)

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
