import {
	PersistQueryClientProvider,
	type PersistQueryClientProviderProps,
} from '@tanstack/react-query-persist-client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createQueryCachePersister } from '@/lib/query-persister'

const CACHE_MAX_AGE_MS = 1000 * 60 * 60 * 24 // 24 hours

export function getContext() {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				gcTime: CACHE_MAX_AGE_MS,
			},
		},
	})
	const persister = createQueryCachePersister()
	return {
		queryClient,
		persister,
		persistOptions: {
			persister,
			maxAge: CACHE_MAX_AGE_MS,
			dehydrateOptions: {
				// Persist paused mutations so they can be re-run after restore or when back online
				shouldDehydrateMutation: () => true,
			},
			onSuccess: () => {
				queryClient.resumePausedMutations()
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
	// In dev, skip persistence so HMR and refetches aren't overridden by rehydrated cache
	if (import.meta.env.DEV) {
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
