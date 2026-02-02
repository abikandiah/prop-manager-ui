import { createContext, useContext, useEffect, useMemo, useState } from 'react'

/**
 * Network status context for offline-first UX.
 * Uses the standard browser APIs: navigator.onLine and the online/offline events.
 * Initial state is true (online) so SSR/hydration match; the real value is set in useEffect.
 */
interface NetworkContextValue {
	isOnline: boolean
}

const NetworkContext = createContext<NetworkContextValue | null>(null)

export function NetworkProvider({ children }: { children: React.ReactNode }) {
	const [isOnline, setIsOnline] = useState(true)

	useEffect(() => {
		setIsOnline(navigator.onLine)

		const handleOnline = () => setIsOnline(true)
		const handleOffline = () => setIsOnline(false)

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
