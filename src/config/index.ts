import { stringToBoolean } from '@abumble/design-system/utils'

export const config = {
	apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '',
	constructionDisabled:
		stringToBoolean(import.meta.env.VITE_CONSTRUCTION_DISABLED) || false,

	persistOfflineInDev:
		stringToBoolean(import.meta.env.VITE_PERSIST_OFFLINE) || false,

	queryCacheMaxAgeHours:
		Number(import.meta.env.VITE_QUERY_CACHE_MAX_AGE_HOURS) || 24,
	queryCacheGcTimeMs:
		Number(import.meta.env.VITE_QUERY_CACHE_GC_TIME_MS) || 30 * 60 * 1000,
	queryCacheStaleTimeMs:
		Number(import.meta.env.VITE_QUERY_CACHE_STALE_TIME_MS) || 5 * 60 * 1000,
	mutationOutboxMaxAgeDays:
		Number(import.meta.env.VITE_MUTATION_OUTBOX_MAX_AGE_DAYS) || 7,
	isDev:
		['localhost', '127.0.0.1', '0.0.0.0'].includes(window.location.hostname) ||
		window.location.hostname.endsWith('.local'),
}
