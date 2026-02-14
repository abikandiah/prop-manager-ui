import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import {
	QueryClient,
	QueryClientProvider,
	type Mutation,
	type Query,
} from '@tanstack/react-query'
import type { PersistQueryClientProviderProps } from '@tanstack/react-query-persist-client'
import { config } from '@/config'
import { createUserScopedDefaults } from './client-config'

/** Mutation instance passed to shouldDehydrateMutation when deciding what to persist. */
type PersistableMutation = Mutation
import { createThrottledCachePersister } from '@/features/offline/cachePersistor'

/**
 * Create user-scoped query client and persistence config.
 * Pure TanStack Query approach - no custom mutation queue.
 *
 * @param userId - User ID for database scoping
 */
export function getContext(userId: string) {
	const queryClient = new QueryClient({
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
