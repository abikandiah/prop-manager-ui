import { IDEMPOTENCY_HEADER } from '@/lib/constants'
import { stableRequestId } from '@/lib/offline-types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useAuth } from '../auth'
import { invitesApi } from './api'
import { TargetType } from './types'

export function useInvitePreview(token: string) {
	return useQuery({
		queryKey: ['invitePreview', token],
		queryFn: () => invitesApi.getPreview(token),
		staleTime: 30_000,
		retry: false,
	})
}

export function useAcceptInvite() {
	const navigate = useNavigate()
	const queryClient = useQueryClient()
	const { refreshUser } = useAuth()

	return useMutation({
		mutationKey: ['acceptInvite'],
		networkMode: 'online',
		mutationFn: (token: string) => invitesApi.accept(token),
		onSuccess: async (data, token) => {
			// Refresh user, clear cached org data
			await refreshUser()
			queryClient.invalidateQueries({ queryKey: ['org'] })
			queryClient.invalidateQueries({ queryKey: ['invitePreview', token] })

			// Navigate and notify
			if (data.targetType === TargetType.LEASE) {
				toast.success("You've joined the lease!")
				navigate({
					to: '/leases/agreements/$leaseId',
					params: { leaseId: data.targetId },
				})
			} else {
				toast.success("You've joined the organization!")
				navigate({ to: '/' })
			}
		},
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
