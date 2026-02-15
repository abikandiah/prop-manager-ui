import { RouterProvider, createRouter } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode, useMemo } from 'react'
import { createRoot } from 'react-dom/client'
import * as TanStackQueryProvider from './integrations/tanstack-query/root-provider.tsx'
import { createBootstrapDefaults } from './integrations/tanstack-query/client-config'
import { routeTree } from './routeTree.gen'
import { NotFound } from './components/NotFound.tsx'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ThemeProvider } from './contexts/theme'
import { NetworkProvider } from './contexts/network'
import { AuthProvider, useAuth } from './contexts/auth'
import { Toaster } from './components/ui'
import reportWebVitals from './reportWebVitals'
import './styles.css'

// Bootstrap client used only for auth (e.g. /me). User-scoped client lives inside AppWithProviders.
const bootstrapQueryClient = new QueryClient({
	defaultOptions: createBootstrapDefaults(),
})

const router = createRouter({
	routeTree,
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

/**
 * App with user-scoped providers.
 * Must be inside AuthProvider to access user ID.
 */
function AppWithProviders() {
	const { user } = useAuth()

	// Use 'anonymous' for unauthenticated users (will be cleared on login)
	const userId = user?.id || 'anonymous'

	// Create user-scoped query client
	const queryContext = useMemo(() => {
		console.log('[App] Creating query client for user:', userId)
		return TanStackQueryProvider.getContext(userId)
	}, [userId])

	return (
		<TanStackQueryProvider.Provider {...queryContext}>
			<ThemeProvider>
				<NetworkProvider>
					<RouterProvider router={router} />
					<Toaster />
				</NetworkProvider>
			</ThemeProvider>
		</TanStackQueryProvider.Provider>
	)
}

// Render the app
const rootElement = document.getElementById('app')
if (rootElement && !rootElement.innerHTML) {
	const root = createRoot(rootElement)
	root.render(
		<StrictMode>
			<ErrorBoundary>
				<QueryClientProvider client={bootstrapQueryClient}>
					<AuthProvider>
						<AppWithProviders />
					</AuthProvider>
				</QueryClientProvider>
			</ErrorBoundary>
		</StrictMode>,
	)
}

reportWebVitals()
