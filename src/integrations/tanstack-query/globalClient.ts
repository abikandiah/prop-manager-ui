import { QueryClient } from '@tanstack/react-query'
import { createBootstrapDefaults } from './client-config'

// Bootstrap client used only for auth (e.g. /me). User-scoped client lives inside AppWithProviders.
export const globalClient = new QueryClient({
	defaultOptions: createBootstrapDefaults(),
})
