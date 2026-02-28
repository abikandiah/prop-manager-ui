import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { membershipsApi } from './api'
import { membershipKeys } from './keys'
import {
	InviteStatus,
	type Membership,
	type UpdateMembershipPayload,
	type InviteMemberPayload,
} from '@/domain/membership'
import { stableRequestId } from '@/lib/offline-types'
import { IDEMPOTENCY_HEADER } from '@/lib/constants'
import { generateId, nowIso } from '@/lib/util'

// --- Queries ---

export function useMembershipsList(orgId: string) {
	return useQuery({
		queryKey: membershipKeys.list(orgId),
		queryFn: () => membershipsApi.listByOrganization(orgId),
		enabled: !!orgId,
	})
}

export function useMembershipById(orgId: string, membershipId: string) {
	return useQuery({
		queryKey: membershipKeys.detail(orgId, membershipId),
		queryFn: () => membershipsApi.getById(orgId, membershipId),
		enabled: !!orgId && !!membershipId,
	})
}

// --- Mutations ---

export function useInviteMember() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationKey: ['inviteMember'],
		networkMode: 'online',
		mutationFn: ({
			orgId,
			payload,
		}: {
			orgId: string
			payload: InviteMemberPayload
		}) => {
			const requestId = stableRequestId(['inviteMember', orgId], payload)
			return membershipsApi.inviteMember(orgId, payload, {
				[IDEMPOTENCY_HEADER]: requestId,
			})
		},
		onMutate: async ({ orgId, payload }) => {
			await queryClient.cancelQueries({
				queryKey: membershipKeys.list(orgId),
			})
			const previous = queryClient.getQueryData<Membership[]>(
				membershipKeys.list(orgId),
			)
			const optimistic: Membership = {
				id: generateId(),
				userId: null,
				userName: null,
				userEmail: null,
				organizationId: orgId,
				membershipTemplateId: payload.templateId ?? null,
				inviteId: null,
				inviteEmail: payload.email,
				inviteStatus: InviteStatus.PENDING,
				lastResentAt: null,
				expiresAt: null,
				version: 0,
				createdAt: nowIso(),
				updatedAt: nowIso(),
			}
			queryClient.setQueryData(
				membershipKeys.list(orgId),
				(old: Membership[] | undefined) =>
					old ? [...old, optimistic] : [optimistic],
			)
			return { previous, orgId }
		},
		onError: (_err, variables, context) => {
			if (context?.previous) {
				queryClient.setQueryData(
					membershipKeys.list(variables.orgId),
					context.previous,
				)
			}
		},
		onSettled: (_data, _err, variables) => {
			queryClient.invalidateQueries({
				queryKey: membershipKeys.list(variables.orgId),
			})
		},
	})
}

export function useUpdateMembership() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationKey: ['updateMembership'],
		networkMode: 'online',
		mutationFn: ({
			orgId,
			membershipId,
			payload,
		}: {
			orgId: string
			membershipId: string
			payload: UpdateMembershipPayload
		}) => {
			const requestId = stableRequestId(
				['updateMembership', membershipId],
				payload,
			)
			return membershipsApi.update(orgId, membershipId, payload, {
				[IDEMPOTENCY_HEADER]: requestId,
			})
		},
		onSettled: (_data, _err, variables) => {
			queryClient.invalidateQueries({
				queryKey: membershipKeys.all(variables.orgId),
			})
			queryClient.invalidateQueries({
				queryKey: membershipKeys.detail(
					variables.orgId,
					variables.membershipId,
				),
			})
		},
	})
}

export function useDeleteMembership() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationKey: ['deleteMembership'],
		networkMode: 'online',
		mutationFn: ({
			orgId,
			membershipId,
		}: {
			orgId: string
			membershipId: string
		}) => {
			const requestId = stableRequestId(
				['deleteMembership', membershipId],
				membershipId,
			)
			return membershipsApi.delete(orgId, membershipId, {
				[IDEMPOTENCY_HEADER]: requestId,
			})
		},
		onMutate: async ({ orgId, membershipId }) => {
			await queryClient.cancelQueries({
				queryKey: membershipKeys.list(orgId),
			})
			const previous = queryClient.getQueryData<Membership[]>(
				membershipKeys.list(orgId),
			)
			queryClient.setQueryData(
				membershipKeys.list(orgId),
				(old: Membership[] | undefined) =>
					old?.filter((m) => m.id !== membershipId) ?? [],
			)
			queryClient.removeQueries({
				queryKey: membershipKeys.detail(orgId, membershipId),
			})
			return { previous, orgId }
		},
		onError: (_err, variables, context) => {
			if (context?.previous) {
				queryClient.setQueryData(
					membershipKeys.list(variables.orgId),
					context.previous,
				)
			}
		},
		onSettled: (_data, _err, variables) => {
			queryClient.invalidateQueries({
				queryKey: membershipKeys.list(variables.orgId),
			})
		},
	})
}
