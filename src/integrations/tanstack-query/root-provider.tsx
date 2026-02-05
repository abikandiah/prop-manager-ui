import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import {
	MutationCache,
	QueryClient,
	QueryClientProvider,
} from '@tanstack/react-query'
import axios from 'axios'
import { toast } from 'sonner'
import type { Query } from '@tanstack/react-query'
import type { PersistQueryClientProviderProps } from '@tanstack/react-query-persist-client'
import { config } from '@/config'
import { createThrottledCachePersister } from '@/features/offline/cachePersistor'
import { db } from '@/features/offline/db'

export function getContext() {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: config.queryCacheStaleTimeMs,
				gcTime: config.queryCacheGcTimeMs,
				networkMode: 'offlineFirst',

				retry: (failureCount, error) => {
					if (axios.isAxiosError(error)) {
						if (
							error.response?.status &&
							error.response.status >= 400 &&
							error.response.status < 500
						) {
							return false
						}
					}

					return failureCount < 2
				},
				// Exponential backoff
				retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
			},
			mutations: {
				networkMode: 'offlineFirst',
				onError: (error) => {
					const message = error.message || 'An error occurred'
					toast.error(message)
				},
			},
		},
		mutationCache: new MutationCache({
			onMutate: async (variables, mutation) => {
				await db.addMutation(mutation.options.mutationKey, variables)
				// startSyncEngine()
			},
		}),
	})

	const persister = createThrottledCachePersister()
	return {
		queryClient,
		persistOptions: {
			persister,
			maxAge: config.queryCacheMaxAgeHours * 60 * 60 * 1000,
			buster: 'app-v1',
			dehydrateOptions: {
				shouldDehydrateQuery: (query: Query) => {
					return query.state.status !== 'error'
				},
			},
			onSuccess: () => {
				console.log(
					'Cache restored from Dexie, checking for pending mutations...',
				)
			},
		},
	}
}

export function Provider({
	children,
	queryClient,
	persistOptions,
}: {
	children: React.ReactNode
	queryClient: PersistQueryClientProviderProps['client']
	persistOptions: PersistQueryClientProviderProps['persistOptions']
}) {
	// In dev, skip persistence unless VITE_PERSIST_OFFLINE is set (so HMR isn't overridden)
	if (import.meta.env.DEV && !config.persistOfflineInDev) {
		return (
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		)
	}
	return (
		<PersistQueryClientProvider
			client={queryClient}
			persistOptions={persistOptions}
		>
			{children}
		</PersistQueryClientProvider>
	)
}
