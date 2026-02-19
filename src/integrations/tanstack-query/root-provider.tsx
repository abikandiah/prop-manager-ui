import { config } from '@/config'
import { createThrottledCachePersister } from '@/features/offline/cachePersistor'
import type { Mutation, Query } from '@tanstack/react-query'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { PersistQueryClientProviderProps } from '@tanstack/react-query-persist-client'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createMutationCache, createUserScopedDefaults } from './client-config'

/** Mutation instance passed to shouldDehydrateMutation when deciding what to persist. */
type PersistableMutation = Mutation

/**
 * Create user-scoped query client and persistence config.
 * Pure TanStack Query approach - no custom mutation queue.
 *
 * @param userId - User ID for database scoping
 */
export function getContext(userId: string) {
	const queryClient = new QueryClient({
		mutationCache: createMutationCache(),
		defaultOptions: createUserScopedDefaults(),
	})

	const persister = createThrottledCachePersister(userId)

	return {
		queryClient,
		persistOptions: {
			persister,
			maxAge: config.queryCacheMaxAgeHours * 60 * 60 * 1000,
			buster: 'app-v1',
			dehydrateOptions: {
				// Persist successful queries
				shouldDehydrateQuery: (query: Query) => {
					return query.state.status !== 'error'
				},
				// Persist paused/pending mutations
				shouldDehydrateMutation: (mutation: PersistableMutation) => {
					// Persist if paused or pending
					if (mutation.state.isPaused) {
						console.log(
							'[Persist] Saving paused mutation:',
							mutation.mutationId,
						)
						return true
					}
					if (mutation.state.status === 'pending') return true
					if (mutation.state.status === 'idle') return true

					// Don't persist successful or failed mutations
					return false
				},
			},
			onSuccess: () => {
				console.log(
					'[Offline] Cache restored from IndexedDB, resuming paused mutations...',
				)
				// Resume paused mutations after cache restore
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
	// In dev, skip persistence unless VITE_PERSIST_OFFLINE is set (so HMR works)
	if (import.meta.env.DEV && !config.persistOfflineInDev) {
		console.log('[Offline] Persistence disabled in development')
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
