import axios from 'axios'

/** RFC 7807 ProblemDetail shape returned by the backend on all errors. */
export interface ProblemDetail {
	type?: string
	title?: string
	status?: number
	detail?: string
	instance?: string
	/** Validation field errors — present on 400 responses. */
	errors?: Array<{ field: string; message: string }>
}

export interface ProblemDetailDisplay {
	title: string
	description?: string
}

/**
 * Normalized error thrown by the API client for all failed requests.
 * Encapsulates conversion from raw errors to ProblemDetailDisplay and construction.
 */
export class ApiError extends Error {
	constructor(
		message: string,
		public readonly problemDetail: ProblemDetailDisplay,
		public readonly status?: number,
		public readonly cause?: unknown,
	) {
		super(message)
		this.name = 'ApiError'
		Object.setPrototypeOf(this, ApiError.prototype)
	}

	/**
	 * Build user-friendly title and optional description from any error.
	 * For Axios errors with ProblemDetail response, uses detail → title → fallback.
	 * For 400 validation errors, builds a field-level description.
	 */
	static buildProblemDetail(error: unknown): ProblemDetailDisplay {
		if (axios.isAxiosError(error)) {
			const data = error.response?.data as ProblemDetail | undefined
			if (data) {
				const title = data.detail ?? data.title ?? 'An error occurred'
				if (data.errors && data.errors.length > 0) {
					const description = data.errors
						.map((e) => `${e.field}: ${e.message}`)
						.join('\n')
					return { title, description }
				}
				return { title }
			}
		}
		const message = error instanceof Error ? error.message : undefined
		return { title: message ?? 'An unexpected error occurred' }
	}

	/**
	 * Create an ApiError from any thrown value (e.g. Axios error from the API client).
	 */
	static from(error: unknown): ApiError {
		if (error instanceof ApiError) return error
		const problemDetail = ApiError.buildProblemDetail(error)
		const status = axios.isAxiosError(error)
			? error.response?.status
			: undefined
		const message =
			error instanceof Error ? error.message : 'An unexpected error occurred'
		return new ApiError(message, problemDetail, status, error)
	}
}

/** Type guard for ApiError. */
export function isApiError(error: unknown): error is ApiError {
	return error instanceof ApiError
}
