import { NotFound } from '@/components/NotFound'
import { LoadingPage } from '@/components/pages'
import { routeTree } from '@/routeTree.gen'
import type { QueryClient } from '@tanstack/react-query'
import { createRouter } from '@tanstack/react-router'

export const router = createRouter({
	routeTree,
	scrollRestoration: true,
	defaultPreload: 'intent',
	defaultStructuralSharing: true,
	defaultPreloadStaleTime: 0,
	defaultNotFoundComponent: NotFound,
	defaultPendingComponent: LoadingPage,
	defaultPendingMs: 500,
	defaultPendingMinMs: 300,
	context: {
		globalClient: undefined!,
	},
})

// Register the router instance for type safety
declare module '@tanstack/react-router' {
	interface Register {
		router: typeof router
	}
}

export type MyRouterContext = {
	globalClient: QueryClient
}
