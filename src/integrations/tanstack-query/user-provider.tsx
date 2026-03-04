import { config } from '@/config'
import { createThrottledCachePersister } from '@/features/offline/cachePersistor'
import {
	Mutation,
	Query,
	QueryClient,
	QueryClientProvider
} from '@tanstack/react-query'
import {
	PersistQueryClientProvider,
	type PersistQueryClientProviderProps,
} from '@tanstack/react-query-persist-client'
import { createMutationCache, createUserScopedDefaults } from './client-config'

/** Mutation instance passed to shouldDehydrateMutation when deciding what to persist. */
type PersistableMutation = Mutation

/**
 * Create user-scoped query client and persistence config.
 * @param userId - User ID for database scoping
 */
export function getUserContext(userId: string) {
	const userClient = new QueryClient({
		mutationCache: createMutationCache(),
		defaultOptions: createUserScopedDefaults(),
	})

	const persistOptions = {
		persister: createThrottledCachePersister(userId),
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
					console.log('[Persist] Saving paused mutation:', mutation.mutationId)
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
			userClient.resumePausedMutations()
		},
	}

	return {
		userClient,
		persistOptions,
	}
}

export function Provider({
	children,
	userClient,
	persistOptions,
}: {
	children: React.ReactNode
	userClient: PersistQueryClientProviderProps['client']
	persistOptions: PersistQueryClientProviderProps['persistOptions']
}) {
	// In dev, skip persistence unless VITE_PERSIST_OFFLINE is set (so HMR works)
	if (config.isDevelopment && !config.persistOfflineInDev) {
		console.log('[Offline] Persistence disabled in development')
		return (
			<QueryClientProvider client={userClient}>{children}</QueryClientProvider>
		)
	}

	return (
		<PersistQueryClientProvider
			client={userClient}
			persistOptions={persistOptions}
		>
			{children}
		</PersistQueryClientProvider>
	)
}
