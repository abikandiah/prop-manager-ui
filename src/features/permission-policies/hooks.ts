import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { permissionPolicyKeys } from './keys'
import { permissionPoliciesApi } from './api'
import type {
	CreatePermissionPolicyPayload,
	PermissionPolicy,
	UpdatePermissionPolicyPayload,
} from '@/domain/permission-policy'
import { stableRequestId } from '@/lib/offline-types'
import { nowIso } from '@/lib/util'
import { IDEMPOTENCY_HEADER } from '@/lib/constants'
import { useOrganization } from '@/contexts/organization'

// --- Queries ---

/**
 * Fetch system policies plus org-scoped policies for the given org.
 * Returns them sorted: system policies first, then org policies, both alphabetically.
 */
export function usePermissionPolicies(orgId: string) {
	return useQuery({
		queryKey: permissionPolicyKeys.list(orgId),
		queryFn: () => permissionPoliciesApi.listByOrg(orgId),
		enabled: !!orgId,
		select: (data) =>
			[...data].sort((a, b) => {
				// System policies (orgId = null) before org policies
				if (a.orgId === null && b.orgId !== null) return -1
				if (a.orgId !== null && b.orgId === null) return 1
				return a.name.localeCompare(b.name)
			}),
	})
}

export function usePermissionPolicyDetail(id: string | null) {
	const { activeOrgId } = useOrganization()
	return useQuery({
		queryKey: permissionPolicyKeys.detail(activeOrgId!, id!),
		queryFn: () => permissionPoliciesApi.getById(id!),
		enabled: !!activeOrgId && id != null,
	})
}

// --- Mutations ---

export function useCreatePermissionPolicy() {
	const queryClient = useQueryClient()
	const { activeOrgId } = useOrganization()

	return useMutation({
		mutationKey: ['createPermissionPolicy'],
		networkMode: 'online',
		mutationFn: (payload: CreatePermissionPolicyPayload) => {
			const requestId = stableRequestId(['createPermissionPolicy'], payload)
			return permissionPoliciesApi.create(payload, {
				[IDEMPOTENCY_HEADER]: requestId,
			})
		},
		onSettled: (_data, _err, payload) => {
			const orgId = payload.orgId ?? activeOrgId!
			queryClient.invalidateQueries({
				queryKey: permissionPolicyKeys.list(orgId),
			})
		},
	})
}

export function useUpdatePermissionPolicy() {
	const queryClient = useQueryClient()
	const { activeOrgId } = useOrganization()

	return useMutation({
		mutationKey: ['updatePermissionPolicy'],
		networkMode: 'online',
		mutationFn: ({
			id,
			payload,
		}: {
			id: string
			payload: UpdatePermissionPolicyPayload
		}) => {
			const variables = { id, payload }
			const requestId = stableRequestId(['updatePermissionPolicy'], variables)
			return permissionPoliciesApi.update(id, payload, {
				[IDEMPOTENCY_HEADER]: requestId,
			})
		},
		onMutate: async ({ id, payload }) => {
			await queryClient.cancelQueries({
				queryKey: permissionPolicyKeys.all(activeOrgId!),
			})
			const previous = queryClient.getQueryData<PermissionPolicy>(
				permissionPolicyKeys.detail(activeOrgId!, id),
			)
			if (previous) {
				queryClient.setQueryData(
					permissionPolicyKeys.detail(activeOrgId!, id),
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
		onError: (_err, { id }, context) => {
			if (context?.previous) {
				queryClient.setQueryData(
					permissionPolicyKeys.detail(activeOrgId!, id),
					context.previous,
				)
			}
		},
		onSettled: (data, _err, { id }) => {
			queryClient.invalidateQueries({
				queryKey: permissionPolicyKeys.detail(activeOrgId!, id),
			})
			const orgId = data?.orgId ?? activeOrgId!
			queryClient.invalidateQueries({
				queryKey: permissionPolicyKeys.list(orgId),
			})
		},
	})
}

export function useDeletePermissionPolicy() {
	const queryClient = useQueryClient()
	const { activeOrgId } = useOrganization()

	return useMutation({
		mutationKey: ['deletePermissionPolicy'],
		networkMode: 'online',
		mutationFn: (id: string) => {
			const requestId = stableRequestId(['deletePermissionPolicy'], id)
			return permissionPoliciesApi.delete(id, {
				[IDEMPOTENCY_HEADER]: requestId,
			})
		},
		onSettled: () => {
			queryClient.invalidateQueries({
				queryKey: permissionPolicyKeys.all(activeOrgId!),
			})
		},
	})
}
