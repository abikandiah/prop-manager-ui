import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { leaseTenantKeys } from './keys'
import { leaseTenantApi } from './api'
import type {
	InviteLeaseTenantPayload,
	LeaseTenant,
} from '@/domain/lease-tenant'
import { stableRequestId } from '@/lib/offline-types'
import { IDEMPOTENCY_HEADER } from '@/lib/constants'

// --- Queries ---

/**
 * Returns all tenant slots for a lease (pending invites + registered + signed).
 */
export function useLeaseTenantsByLeaseId(leaseId: string | null) {
	return useQuery({
		queryKey: leaseTenantKeys.byLease(leaseId!),
		queryFn: () => leaseTenantApi.list(leaseId!),
		enabled: leaseId != null,
	})
}

// --- Mutations ---

/**
 * Invite one or more people to a DRAFT lease by email.
 * Each entry specifies an email and role (PRIMARY or OCCUPANT).
 */
export function useInviteLeaseTenants(leaseId: string) {
	const queryClient = useQueryClient()

	return useMutation({
		mutationKey: ['inviteLeaseTenants', leaseId],
		networkMode: 'online',
		mutationFn: (payload: InviteLeaseTenantPayload) => {
			const requestId = stableRequestId(
				['inviteLeaseTenants', leaseId],
				payload,
			)
			return leaseTenantApi.invite(leaseId, payload, {
				[IDEMPOTENCY_HEADER]: requestId,
			})
		},
		onSettled: () => {
			queryClient.invalidateQueries({
				queryKey: leaseTenantKeys.byLease(leaseId),
			})
		},
	})
}

/**
 * Remove a tenant slot from a DRAFT lease.
 * Optimistically removes from the list; rolls back on error.
 */
export function useRemoveLeaseTenant(leaseId: string) {
	const queryClient = useQueryClient()

	return useMutation({
		mutationKey: ['removeLeaseTenant', leaseId],
		networkMode: 'online',
		mutationFn: (leaseTenantId: string) =>
			leaseTenantApi.remove(leaseId, leaseTenantId),
		onMutate: async (leaseTenantId) => {
			await queryClient.cancelQueries({
				queryKey: leaseTenantKeys.byLease(leaseId),
			})
			const previous = queryClient.getQueryData<Array<LeaseTenant>>(
				leaseTenantKeys.byLease(leaseId),
			)
			queryClient.setQueryData(
				leaseTenantKeys.byLease(leaseId),
				(old: Array<LeaseTenant> | undefined) =>
					old?.filter((lt) => lt.id !== leaseTenantId) ?? [],
			)
			return { previous }
		},
		onError: (_err, _id, context) => {
			if (context?.previous) {
				queryClient.setQueryData(
					leaseTenantKeys.byLease(leaseId),
					context.previous,
				)
			}
		},
		onSettled: () => {
			queryClient.invalidateQueries({
				queryKey: leaseTenantKeys.byLease(leaseId),
			})
		},
	})
}
