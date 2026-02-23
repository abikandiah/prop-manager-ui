import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { memberScopeKeys } from './keys'
import { memberScopesApi } from './api'
import type {
	CreateMemberScopePayload,
	MemberScope,
	UpdateMemberScopePayload,
} from '@/domain/member-scope'
import { stableRequestId } from '@/lib/offline-types'
import { nowIso } from '@/lib/util'
import { IDEMPOTENCY_HEADER } from '@/lib/constants'

// --- Queries ---

export function useMemberScopesList(orgId: string, membershipId: string) {
	return useQuery({
		queryKey: memberScopeKeys.list(orgId, membershipId),
		queryFn: () => memberScopesApi.list(orgId, membershipId),
		enabled: !!orgId && !!membershipId,
	})
}

export function useMemberScopeDetail(
	orgId: string,
	membershipId: string,
	scopeId: string | null,
) {
	return useQuery({
		queryKey: memberScopeKeys.detail(orgId, membershipId, scopeId!),
		queryFn: () => memberScopesApi.getById(orgId, membershipId, scopeId!),
		enabled: !!orgId && !!membershipId && scopeId != null,
	})
}

// --- Mutations ---

export function useCreateMemberScope() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationKey: ['createMemberScope'],
		networkMode: 'online',
		mutationFn: ({
			orgId,
			membershipId,
			payload,
		}: {
			orgId: string
			membershipId: string
			payload: CreateMemberScopePayload
		}) => {
			const requestId = stableRequestId(['createMemberScope'], {
				orgId,
				membershipId,
				payload,
			})
			return memberScopesApi.create(orgId, membershipId, payload, {
				[IDEMPOTENCY_HEADER]: requestId,
			})
		},
		onSettled: (_data, _err, { orgId, membershipId }) => {
			queryClient.invalidateQueries({
				queryKey: memberScopeKeys.list(orgId, membershipId),
			})
		},
	})
}

export function useUpdateMemberScope() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationKey: ['updateMemberScope'],
		networkMode: 'online',
		mutationFn: ({
			orgId,
			membershipId,
			scopeId,
			payload,
		}: {
			orgId: string
			membershipId: string
			scopeId: string
			payload: UpdateMemberScopePayload
		}) => {
			const requestId = stableRequestId(['updateMemberScope'], {
				orgId,
				membershipId,
				scopeId,
				payload,
			})
			return memberScopesApi.update(orgId, membershipId, scopeId, payload, {
				[IDEMPOTENCY_HEADER]: requestId,
			})
		},
		onMutate: async ({ orgId, membershipId, scopeId, payload }) => {
			await queryClient.cancelQueries({
				queryKey: memberScopeKeys.list(orgId, membershipId),
			})
			const previous = queryClient.getQueryData<MemberScope>(
				memberScopeKeys.detail(orgId, membershipId, scopeId),
			)
			if (previous) {
				queryClient.setQueryData(
					memberScopeKeys.detail(orgId, membershipId, scopeId),
					{
						...previous,
						...payload,
						updatedAt: nowIso(),
						version: previous.version + 1,
					},
				)
			}
			return { previous }
		},
		onError: (_err, { orgId, membershipId, scopeId }, context) => {
			if (context?.previous) {
				queryClient.setQueryData(
					memberScopeKeys.detail(orgId, membershipId, scopeId),
					context.previous,
				)
			}
		},
		onSettled: (_data, _err, { orgId, membershipId, scopeId }) => {
			queryClient.invalidateQueries({
				queryKey: memberScopeKeys.detail(orgId, membershipId, scopeId),
			})
			queryClient.invalidateQueries({
				queryKey: memberScopeKeys.list(orgId, membershipId),
			})
		},
	})
}

export function useDeleteMemberScope() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationKey: ['deleteMemberScope'],
		networkMode: 'online',
		mutationFn: ({
			orgId,
			membershipId,
			scopeId,
		}: {
			orgId: string
			membershipId: string
			scopeId: string
		}) => {
			const requestId = stableRequestId(['deleteMemberScope'], {
				orgId,
				membershipId,
				scopeId,
			})
			return memberScopesApi.delete(orgId, membershipId, scopeId, {
				[IDEMPOTENCY_HEADER]: requestId,
			})
		},
		onSettled: (_data, _err, { orgId, membershipId }) => {
			queryClient.invalidateQueries({
				queryKey: memberScopeKeys.list(orgId, membershipId),
			})
		},
	})
}
