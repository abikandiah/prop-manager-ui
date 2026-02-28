import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { policyAssignmentKeys } from './keys'
import { policyAssignmentsApi } from './api'
import type {
	CreatePolicyAssignmentPayload,
	PolicyAssignment,
	UpdatePolicyAssignmentPayload,
} from '@/domain/policy-assignment'
import { stableRequestId } from '@/lib/offline-types'
import { generateId, nowIso } from '@/lib/util'
import { IDEMPOTENCY_HEADER } from '@/lib/constants'

/** Payload for create without id — the hook generates it. */
export type CreatePolicyAssignmentPayloadWithoutId = Omit<
	CreatePolicyAssignmentPayload,
	'id'
>

// --- Queries ---

export function usePolicyAssignmentsList(orgId: string, membershipId: string) {
	return useQuery({
		queryKey: policyAssignmentKeys.list(orgId, membershipId),
		queryFn: () => policyAssignmentsApi.list(orgId, membershipId),
		enabled: !!orgId && !!membershipId,
	})
}

export function usePolicyAssignmentDetail(
	orgId: string,
	membershipId: string,
	assignmentId: string | null,
) {
	return useQuery({
		queryKey: policyAssignmentKeys.detail(orgId, membershipId, assignmentId!),
		queryFn: () =>
			policyAssignmentsApi.getById(orgId, membershipId, assignmentId!),
		enabled: !!orgId && !!membershipId && assignmentId != null,
	})
}

// --- Mutations ---

export function useCreatePolicyAssignment() {
	const queryClient = useQueryClient()

	const mutation = useMutation({
		mutationKey: ['createPolicyAssignment'],
		networkMode: 'online',
		mutationFn: ({
			orgId,
			membershipId,
			payload,
		}: {
			orgId: string
			membershipId: string
			payload: CreatePolicyAssignmentPayload
		}) => {
			const requestId = stableRequestId(['createPolicyAssignment'], {
				orgId,
				membershipId,
				payload,
			})
			return policyAssignmentsApi.create(orgId, membershipId, payload, {
				[IDEMPOTENCY_HEADER]: requestId,
			})
		},
		onMutate: async ({ orgId, membershipId, payload }) => {
			await queryClient.cancelQueries({
				queryKey: policyAssignmentKeys.list(orgId, membershipId),
			})
			const previous = queryClient.getQueryData<PolicyAssignment[]>(
				policyAssignmentKeys.list(orgId, membershipId),
			)
			const optimistic: PolicyAssignment = {
				id: payload.id,
				resourceType: payload.resourceType,
				resourceId: payload.resourceId,
				policyId: payload.policyId ?? null,
				overrides: payload.overrides ?? null,
				membershipId,
				version: 0,
				createdAt: nowIso(),
				updatedAt: nowIso(),
			}
			queryClient.setQueryData(
				policyAssignmentKeys.list(orgId, membershipId),
				(old: PolicyAssignment[] | undefined) =>
					old ? [...old, optimistic] : [optimistic],
			)
			return { previous }
		},
		onError: (_err, { orgId, membershipId }, context) => {
			if (context?.previous) {
				queryClient.setQueryData(
					policyAssignmentKeys.list(orgId, membershipId),
					context.previous,
				)
			}
		},
		onSettled: (_data, _err, { orgId, membershipId }) => {
			queryClient.invalidateQueries({
				queryKey: policyAssignmentKeys.list(orgId, membershipId),
			})
		},
	})

	return {
		...mutation,
		mutate: (
			args: {
				orgId: string
				membershipId: string
				payload: CreatePolicyAssignmentPayloadWithoutId
			},
			options?: Parameters<typeof mutation.mutate>[1],
		) =>
			mutation.mutate(
				{ ...args, payload: { ...args.payload, id: generateId() } },
				options,
			),
		mutateAsync: (
			args: {
				orgId: string
				membershipId: string
				payload: CreatePolicyAssignmentPayloadWithoutId
			},
			options?: Parameters<typeof mutation.mutateAsync>[1],
		) =>
			mutation.mutateAsync(
				{ ...args, payload: { ...args.payload, id: generateId() } },
				options,
			),
	}
}

export function useUpdatePolicyAssignment() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationKey: ['updatePolicyAssignment'],
		networkMode: 'online',
		mutationFn: ({
			orgId,
			membershipId,
			assignmentId,
			payload,
		}: {
			orgId: string
			membershipId: string
			assignmentId: string
			payload: UpdatePolicyAssignmentPayload
		}) => {
			const requestId = stableRequestId(['updatePolicyAssignment'], {
				orgId,
				membershipId,
				assignmentId,
				payload,
			})
			return policyAssignmentsApi.update(
				orgId,
				membershipId,
				assignmentId,
				payload,
				{ [IDEMPOTENCY_HEADER]: requestId },
			)
		},
		onMutate: async ({ orgId, membershipId, assignmentId, payload }) => {
			await queryClient.cancelQueries({
				queryKey: policyAssignmentKeys.list(orgId, membershipId),
			})
			const previous = queryClient.getQueryData<PolicyAssignment>(
				policyAssignmentKeys.detail(orgId, membershipId, assignmentId),
			)
			if (previous) {
				queryClient.setQueryData(
					policyAssignmentKeys.detail(orgId, membershipId, assignmentId),
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
		onError: (_err, { orgId, membershipId, assignmentId }, context) => {
			if (context?.previous) {
				queryClient.setQueryData(
					policyAssignmentKeys.detail(orgId, membershipId, assignmentId),
					context.previous,
				)
			}
		},
		onSettled: (_data, _err, { orgId, membershipId, assignmentId }) => {
			queryClient.invalidateQueries({
				queryKey: policyAssignmentKeys.detail(
					orgId,
					membershipId,
					assignmentId,
				),
			})
			queryClient.invalidateQueries({
				queryKey: policyAssignmentKeys.list(orgId, membershipId),
			})
		},
	})
}

export function useDeletePolicyAssignment() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationKey: ['deletePolicyAssignment'],
		networkMode: 'online',
		mutationFn: ({
			orgId,
			membershipId,
			assignmentId,
		}: {
			orgId: string
			membershipId: string
			assignmentId: string
		}) => {
			const requestId = stableRequestId(['deletePolicyAssignment'], {
				orgId,
				membershipId,
				assignmentId,
			})
			return policyAssignmentsApi.delete(orgId, membershipId, assignmentId, {
				[IDEMPOTENCY_HEADER]: requestId,
			})
		},
		onSettled: (_data, _err, { orgId, membershipId }) => {
			queryClient.invalidateQueries({
				queryKey: policyAssignmentKeys.list(orgId, membershipId),
			})
		},
	})
}
