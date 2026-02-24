import { useRef } from 'react'
import { toast } from 'sonner'

/**
 * Shows an error toast once per unique error instance from a TanStack Query result.
 * Prevents duplicate toasts on re-renders by tracking the last error shown.
 *
 * @param isError - Whether the query is in an error state
 * @param error - The error object from the query
 * @param message - A human-readable label for the resource being loaded (e.g. "members", "properties")
 */
export function useQueryErrorToast(
	isError: boolean,
	error: Error | null,
	message: string,
) {
	const lastErrorRef = useRef<unknown>(null)
	if (isError && error !== lastErrorRef.current) {
		lastErrorRef.current = error
		toast.error(`Error loading ${message}: ${error?.message || 'Unknown'}`)
	}
	if (!isError) lastErrorRef.current = null
}
