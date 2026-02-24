import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { invitesApi } from './api'
import type { CreateInvitePayload } from './types'
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

export function useCreateInvite() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationKey: ['createInvite'],
		networkMode: 'online',
		mutationFn: (payload: CreateInvitePayload) => {
			const requestId = stableRequestId(['createInvite'], payload)
			return invitesApi.create(payload, {
				[IDEMPOTENCY_HEADER]: requestId,
			})
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['invites'] })
			queryClient.invalidateQueries({ queryKey: ['memberships'] })
		},
	})
}

export function useResendInvite() {
	return useMutation({
		mutationKey: ['resendInvite'],
		networkMode: 'online',
		mutationFn: (id: string) => {
			const requestId = stableRequestId(['resendInvite'], id)
			return invitesApi.resend(id, undefined, {
				[IDEMPOTENCY_HEADER]: requestId,
			})
		},
	})
}

export function useRevokeInvite() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationKey: ['revokeInvite'],
		networkMode: 'online',
		mutationFn: (id: string) => {
			const requestId = stableRequestId(['revokeInvite'], id)
			return invitesApi.revoke(id, { [IDEMPOTENCY_HEADER]: requestId })
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['invites'] })
			queryClient.invalidateQueries({ queryKey: ['memberships'] })
		},
	})
}
