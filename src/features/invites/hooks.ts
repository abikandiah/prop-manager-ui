import { useMutation, useQuery } from '@tanstack/react-query'
import { invitesApi } from './api'
import { stableRequestId } from '@/lib/offline-types'
import { IDEMPOTENCY_HEADER } from '@/lib/constants'

export function useInvitePreview(token: string) {
	return useQuery({
		queryKey: ['invitePreview', token],
		queryFn: () => invitesApi.getPreview(token),
		staleTime: 30_000,
		retry: false,
	})
}

export function useAcceptInvite() {
	return useMutation({
		mutationKey: ['acceptInvite'],
		networkMode: 'online',
		mutationFn: (token: string) => invitesApi.accept(token),
	})
}

export function useResendInvite() {
	return useMutation({
		mutationKey: ['resendInvite'],
		networkMode: 'online',
		mutationFn: (id: string) => {
			const requestId = stableRequestId(['resendInvite'], id)
			return invitesApi.resend(id, {
				[IDEMPOTENCY_HEADER]: requestId,
			})
		},
	})
}

export function useRevokeInvite() {
	return useMutation({
		mutationKey: ['revokeInvite'],
		networkMode: 'online',
		mutationFn: (id: string) => {
			const requestId = stableRequestId(['revokeInvite'], id)
			return invitesApi.revoke(id, { [IDEMPOTENCY_HEADER]: requestId })
		},
		// No onSuccess/onSettled — callers own their invalidation.
	})
}
