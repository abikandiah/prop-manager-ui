import { ApiError } from '@/api/errors'
import { config } from '@/config'
import axios from 'axios'

const DEV_AUTH_TOKEN_KEY = 'DEV_AUTH_TOKEN'

let cachedToken: string | null = null

// Module-level org store — one variable per browser tab, never localStorage.
let _activeOrgId: string | null = null

/** Called by OrganizationProvider on every activeOrg change. */
export function setActiveOrgId(id: string | null): void {
	_activeOrgId = id
}

/** Called by the Axios request interceptor on every outgoing request. */
export function getActiveOrgId(): string | null {
	return _activeOrgId
}

export const getDevToken = () => {
	if (!config.isDevelopment) return null
	if (cachedToken === null) {
		cachedToken = localStorage.getItem(DEV_AUTH_TOKEN_KEY)
	}
	return cachedToken
}

export const setDevToken = (token: string) => {
	if (!config.isDevelopment) return
	cachedToken = token
	localStorage.setItem(DEV_AUTH_TOKEN_KEY, token)
}

export const clearDevToken = () => {
	if (!config.isDevelopment) return
	cachedToken = null
	localStorage.removeItem(DEV_AUTH_TOKEN_KEY)
}

export const api = axios.create({
	baseURL: config.apiBaseUrl || 'http://localhost:8080/api',
	timeout: 10000,
	headers: {
		'Content-Type': 'application/json',
	},
	withCredentials: true,
})

// Request Interceptor: Dev token + org context injection
api.interceptors.request.use((_config) => {
	// Dev: attach Bearer token from localStorage
	if (config.isDevelopment) {
		const token = getDevToken()
		if (token) {
			_config.headers['Authorization'] = `Bearer ${token}`
		}
	}

	// Append ?orgId= to every request when an active org is set.
	// The backend's @RequestParam UUID orgId binding resolves it for authorization.
	const orgId = getActiveOrgId()
	if (orgId) {
		_config.params = { ..._config.params, orgId }
	}

	return _config
})

// Response Interceptor: Global Error Handling + Network Detection
api.interceptors.response.use(
	(response) => {
		// Report successful request to NetworkProvider
		if (typeof (window as any).__reportRequestSuccess === 'function') {
			;(window as any).__reportRequestSuccess()
		}
		return response
	},
	(error) => {
		// Handle 401 Unauthorized
		if (error.response?.status === 401) {
			console.error('401 Unauthorized')
			if (config.isDevelopment) {
				clearDevToken()
			}
		}

		// Report failed request to NetworkProvider
		// Only report server errors and network errors (not 4xx client errors)
		const shouldReport =
			!error.response || // Network error
			error.code === 'ECONNABORTED' || // Timeout
			error.code === 'ERR_NETWORK' || // Network error
			(error.response?.status >= 500 && error.response?.status < 600) // 5xx errors

		if (shouldReport) {
			if (typeof (window as any).__reportRequestFailure === 'function') {
				;(window as any).__reportRequestFailure()
			}
		}

		return Promise.reject(ApiError.from(error))
	},
)
