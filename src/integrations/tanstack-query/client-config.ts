import axios from 'axios'
import { toast } from 'sonner'
import type { DefaultOptions } from '@tanstack/react-query'
import { config } from '@/config'

/**
 * Shared retry logic for queries.
 * Skips retrying 4xx client errors (including 401 Unauthorized).
 */
export function createQueryRetryFn() {
	return (failureCount: number, error: Error) => {
		if (axios.isAxiosError(error)) {
			// Don't retry 4xx client errors
			if (
				error.response?.status &&
				error.response.status >= 400 &&
				error.response.status < 500
			) {
				return false
			}
		}

		return failureCount < 2
	}
}

/**
 * Shared retry logic for mutations.
 * Handles race conditions for dependent mutations (retries 404).
 */
export function createMutationRetryFn() {
	return (failureCount: number, error: Error) => {
		if (axios.isAxiosError(error)) {
			const status = error.response?.status

			// Don't retry 4xx errors (except 404 - might be race condition)
			if (status && status >= 400 && status < 500 && status !== 404) {
				return false
			}

			// Retry 404 a few times (dependent mutation waiting for parent)
			if (status === 404 && failureCount < 3) {
				console.log(
					`[Retry] 404 error, retrying (attempt ${failureCount + 1}/3)`,
				)
				return true
			}
		}

		// Retry 5xx errors and network errors
		return failureCount < 2
	}
}

/**
 * Minimal query client defaults for bootstrap/auth client.
 * Only includes query retry logic (no mutations, no persistence).
 */
export function createBootstrapDefaults(): DefaultOptions {
	return {
		queries: {
			retry: createQueryRetryFn(),
			retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
		},
	}
}

/**
 * Full query client defaults for user-scoped client.
 * Includes offline-first queries, mutation handling, and persistence support.
 */
export function createUserScopedDefaults(): DefaultOptions {
	return {
		queries: {
			staleTime: config.queryCacheStaleTimeMs,
			gcTime: config.queryCacheGcTimeMs,
			networkMode: 'offlineFirst',
			retry: createQueryRetryFn(),
			retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
		},
		mutations: {
			// 'online' mode: Mutations pause when offline, resume when online
			networkMode: 'online',

			onError: (error) => {
				const message = error.message || 'An error occurred'
				toast.error(message)
			},

			retry: createMutationRetryFn(),
			retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
		},
	}
}
