import { NotFound } from '@/components/NotFound'
import { routeTree } from '@/routeTree.gen'
import type { QueryClient } from '@tanstack/react-query'
import { createRouter } from '@tanstack/react-router'

export const router = createRouter({
	routeTree,
	context: {
		globalClient: undefined!,
	},
	defaultPreload: 'intent',
	scrollRestoration: true,
	defaultStructuralSharing: true,
	defaultPreloadStaleTime: 0,
	defaultNotFoundComponent: NotFound,
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
