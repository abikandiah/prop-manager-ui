import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { permissionTemplateKeys } from './keys'
import { permissionTemplatesApi } from './api'
import type {
	CreatePermissionTemplatePayload,
	PermissionTemplate,
	UpdatePermissionTemplatePayload,
} from '@/domain/permission-template'
import { stableRequestId } from '@/lib/offline-types'
import { nowIso } from '@/lib/util'
import { IDEMPOTENCY_HEADER } from '@/lib/constants'
import { useOrganization } from '@/contexts/organization'

// --- Queries ---

/**
 * Fetch system templates plus org-scoped templates for the given org.
 * Returns them sorted: system templates first, then org templates, both alphabetically.
 */
export function usePermissionTemplates(orgId: string) {
	return useQuery({
		queryKey: permissionTemplateKeys.list(orgId),
		queryFn: () => permissionTemplatesApi.listByOrg(orgId),
		enabled: !!orgId,
		select: (data) =>
			[...data].sort((a, b) => {
				// System templates (orgId = null) before org templates
				if (a.orgId === null && b.orgId !== null) return -1
				if (a.orgId !== null && b.orgId === null) return 1
				return a.name.localeCompare(b.name)
			}),
	})
}

export function usePermissionTemplateDetail(id: string | null) {
	const { activeOrgId } = useOrganization()
	return useQuery({
		queryKey: permissionTemplateKeys.detail(activeOrgId!, id!),
		queryFn: () => permissionTemplatesApi.getById(id!),
		enabled: !!activeOrgId && id != null,
	})
}

// --- Mutations ---

export function useCreatePermissionTemplate() {
	const queryClient = useQueryClient()
	const { activeOrgId } = useOrganization()

	return useMutation({
		mutationKey: ['createPermissionTemplate'],
		networkMode: 'online',
		mutationFn: (payload: CreatePermissionTemplatePayload) => {
			const requestId = stableRequestId(['createPermissionTemplate'], payload)
			return permissionTemplatesApi.create(payload, {
				[IDEMPOTENCY_HEADER]: requestId,
			})
		},
		onSettled: (_data, _err, payload) => {
			const orgId = payload.orgId ?? activeOrgId!
			queryClient.invalidateQueries({
				queryKey: permissionTemplateKeys.list(orgId),
			})
		},
	})
}

export function useUpdatePermissionTemplate() {
	const queryClient = useQueryClient()
	const { activeOrgId } = useOrganization()

	return useMutation({
		mutationKey: ['updatePermissionTemplate'],
		networkMode: 'online',
		mutationFn: ({
			id,
			payload,
		}: {
			id: string
			payload: UpdatePermissionTemplatePayload
		}) => {
			const variables = { id, payload }
			const requestId = stableRequestId(['updatePermissionTemplate'], variables)
			return permissionTemplatesApi.update(id, payload, {
				[IDEMPOTENCY_HEADER]: requestId,
			})
		},
		onMutate: async ({ id, payload }) => {
			await queryClient.cancelQueries({
				queryKey: permissionTemplateKeys.all(activeOrgId!),
			})
			const previous = queryClient.getQueryData<PermissionTemplate>(
				permissionTemplateKeys.detail(activeOrgId!, id),
			)
			if (previous) {
				queryClient.setQueryData(
					permissionTemplateKeys.detail(activeOrgId!, id),
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
					permissionTemplateKeys.detail(activeOrgId!, id),
					context.previous,
				)
			}
		},
		onSettled: (data, _err, { id }) => {
			queryClient.invalidateQueries({
				queryKey: permissionTemplateKeys.detail(activeOrgId!, id),
			})
			const orgId = data?.orgId ?? activeOrgId!
			queryClient.invalidateQueries({
				queryKey: permissionTemplateKeys.list(orgId),
			})
		},
	})
}

export function useDeletePermissionTemplate() {
	const queryClient = useQueryClient()
	const { activeOrgId } = useOrganization()

	return useMutation({
		mutationKey: ['deletePermissionTemplate'],
		networkMode: 'online',
		mutationFn: (id: string) => {
			const requestId = stableRequestId(['deletePermissionTemplate'], id)
			return permissionTemplatesApi.delete(id, {
				[IDEMPOTENCY_HEADER]: requestId,
			})
		},
		onSettled: () => {
			queryClient.invalidateQueries({
				queryKey: permissionTemplateKeys.all(activeOrgId!),
			})
		},
	})
}
