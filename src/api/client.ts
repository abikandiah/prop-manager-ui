import axios from 'axios'
import { config } from '@/config'

export const api = axios.create({
	baseURL: config.apiBaseUrl.replace(/\/$/, ''),
})

// Response Interceptor: Global Error Handling
api.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response?.status === 401) {
			console.error('Unauthorized!')
		}
		return Promise.reject(error)
	},
)
