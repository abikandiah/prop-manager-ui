import { ApiError } from '@/api/errors'
import { config } from '@/config'
import type { DefaultOptions } from '@tanstack/react-query'
import { MutationCache } from '@tanstack/react-query'
import { toast } from 'sonner'

export { ApiError, isApiError } from '@/api/errors'
export type { ProblemDetail } from '@/api/errors'

/**
 * Extract a user-friendly title and optional description from any error.
 * Uses ApiError.problemDetail when available; otherwise parses via ApiError.buildProblemDetail.
 */
export function extractProblemDetail(error: unknown): {
	title: string
	description?: string
} {
	if (error instanceof ApiError) return error.problemDetail
	return ApiError.buildProblemDetail(error)
}

/**
 * Shared retry logic for queries.
 * Skips retrying 4xx client errors (including 401 Unauthorized).
 */
export function queryRetryFn(failureCount: number, error: Error) {
	const status =
		error instanceof ApiError
			? error.status
			: (error as { response?: { status?: number } }).response?.status
	if (status != null && status >= 400 && status < 500) return false
	return failureCount < 2
}

/**
 * Shared retry logic for mutations.
 * Handles race conditions for dependent mutations (retries 404).
 */
export function mutationRetryFn(failureCount: number, error: Error) {
	const status =
		error instanceof ApiError
			? error.status
			: (error as { response?: { status?: number } }).response?.status
	if (status != null && status >= 400 && status < 500 && status !== 404) {
		return false
	}
	if (status === 404 && failureCount < 3) {
		console.log(`[Retry] 404 error, retrying (attempt ${failureCount + 1}/3)`)
		return true
	}
	return failureCount < 2
}

/**
 * MutationCache that shows a global toast on every mutation error.
 * Use mutation.meta.skipGlobalErrorToast to opt out (e.g. inline form validation).
 */
export function createMutationCache(): MutationCache {
	return new MutationCache({
		onError: (error, _variables, _context, mutation) => {
			if (
				(mutation.meta as { skipGlobalErrorToast?: boolean })
					?.skipGlobalErrorToast
			) {
				return
			}
			const { title, description } = extractProblemDetail(error)
			toast.error(title, description ? { description } : undefined)
		},
	})
}

/**
 * Minimal query client defaults for bootstrap/auth client.
 * Only includes query retry logic (no mutations, no persistence).
 */
export function createBootstrapDefaults(): DefaultOptions {
	return {
		queries: {
			retry: queryRetryFn,
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
			retry: queryRetryFn,
			retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
		},
		mutations: {
			// 'online' mode: Mutations pause when offline, resume when online
			networkMode: 'online',
			retry: mutationRetryFn,
			retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
		},
	}
}
