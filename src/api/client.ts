import axios from 'axios'
import { config } from '@/config'

export const api = axios.create({
	baseURL: config.apiBaseUrl || '/api',
	timeout: 10000,
	headers: {
		'Content-Type': 'application/json',
	},
	withCredentials: true,
})

// Response Interceptor: Global Error Handling
api.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response?.status === 401) {
			console.error('401 Unauthorized')
		}
		return Promise.reject(error)
	},
)
