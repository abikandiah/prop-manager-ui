import axios from 'axios'
import { config } from '@/config'

const DEV_AUTH_TOKEN_KEY = 'DEV_AUTH_TOKEN'

let cachedToken: string | null = null

export const getDevToken = () => {
	if (cachedToken === null) {
		cachedToken = localStorage.getItem(DEV_AUTH_TOKEN_KEY)
	}
	return cachedToken
}

export const setDevToken = (token: string) => {
	cachedToken = token
	localStorage.setItem(DEV_AUTH_TOKEN_KEY, token)
}

export const clearDevToken = () => {
	cachedToken = ''
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

// Request Interceptor: Add Dev Token
api.interceptors.request.use((_config) => {
	const token = getDevToken()
	if (token) {
		_config.headers['Authentication'] = `Bearer ${token}`
	}
	return _config
})

// Response Interceptor: Global Error Handling
api.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response?.status === 401) {
			console.error('401 Unauthorized')
			if (config.isDev) {
				clearDevToken()
				if (window.location.pathname !== '/dev/auth') {
					window.location.href = '/dev/auth'
				}
			}
		}
		return Promise.reject(error)
	},
)
