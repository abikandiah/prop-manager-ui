import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { leaseTemplateKeys } from './keys'
import { leaseTemplatesApi } from './api'
import type {
	CreateLeaseTemplatePayload,
	LeaseTemplate,
	UpdateLeaseTemplatePayload,
} from '@/domain/lease-template'
import { stableRequestId } from '@/lib/offline-types'
import { nowIso } from '@/lib/util'
import { IDEMPOTENCY_HEADER } from '@/lib/constants'
import { useOrganization } from '@/contexts/organization'

// --- Helpers: Optimistic Updates ---

function applyCreate(
	queryClient: ReturnType<typeof useQueryClient>,
	payload: CreateLeaseTemplatePayload,
	orgId: string,
): LeaseTemplate {
	const optimistic: LeaseTemplate = {
		id: payload.id, // Use client-generated ID from payload
		name: payload.name,
		versionTag: payload.versionTag ?? null,
		version: 0,
		templateMarkdown: payload.templateMarkdown,
		templateParameters: payload.templateParameters ?? {},
		defaultLateFeeType: payload.defaultLateFeeType ?? null,
		defaultLateFeeAmount: payload.defaultLateFeeAmount ?? null,
		defaultNoticePeriodDays: payload.defaultNoticePeriodDays ?? null,
		active: true,
		createdAt: nowIso(),
		updatedAt: nowIso(),
	}
	queryClient.setQueryData(
		leaseTemplateKeys.list(orgId),
		(old: Array<LeaseTemplate> | undefined) =>
			old ? [...old, optimistic] : [optimistic],
	)
	return optimistic
}

function applyUpdate(
	queryClient: ReturnType<typeof useQueryClient>,
	id: string,
	payload: UpdateLeaseTemplatePayload,
	orgId: string,
): void {
	const updatedAt = nowIso()
	const { version: _version, ...templateFields } = payload

	// Update list cache
	queryClient.setQueryData(
		leaseTemplateKeys.list(orgId),
		(old: Array<LeaseTemplate> | undefined) =>
			old?.map((t) =>
				t.id === id
					? {
							...t,
							...templateFields,
							updatedAt,
							version: t.version + 1,
						}
					: t,
			) ?? [],
	)

	// Update detail cache
	queryClient.setQueryData(
		leaseTemplateKeys.detail(orgId, id),
		(old: LeaseTemplate | undefined) =>
			old
				? {
						...old,
						...templateFields,
						updatedAt,
						version: old.version + 1,
					}
				: undefined,
	)
}

function applyDelete(
	queryClient: ReturnType<typeof useQueryClient>,
	id: string,
	orgId: string,
): void {
	queryClient.setQueryData(
		leaseTemplateKeys.list(orgId),
		(old: Array<LeaseTemplate> | undefined) =>
			old?.filter((t) => t.id !== id) ?? [],
	)
	queryClient.removeQueries({ queryKey: leaseTemplateKeys.detail(orgId, id) })
}

// --- Queries ---

export function useLeaseTemplatesList() {
	const { activeOrgId } = useOrganization()
	return useQuery({
		queryKey: leaseTemplateKeys.list(activeOrgId!),
		queryFn: () => leaseTemplatesApi.list(),
		enabled: !!activeOrgId,
	})
}

export function useLeaseTemplatesActive() {
	const { activeOrgId } = useOrganization()
	return useQuery({
		queryKey: leaseTemplateKeys.list(activeOrgId!, { active: true }),
		queryFn: () => leaseTemplatesApi.listActive(),
		enabled: !!activeOrgId,
	})
}

export function useLeaseTemplatesSearch(query: string | null) {
	const { activeOrgId } = useOrganization()
	return useQuery({
		queryKey: leaseTemplateKeys.list(activeOrgId!, { search: query }),
		queryFn: () => leaseTemplatesApi.search(query!),
		enabled: !!activeOrgId && query != null && query.trim().length > 0,
	})
}

export function useLeaseTemplateDetail(
	id: string | null,
	options?: { enabled?: boolean },
) {
	const { activeOrgId } = useOrganization()
	return useQuery({
		queryKey: leaseTemplateKeys.detail(activeOrgId!, id!),
		queryFn: () => leaseTemplatesApi.getById(id!),
		enabled: options?.enabled ?? (!!activeOrgId && id != null),
	})
}

// --- Mutations ---

export function useCreateLeaseTemplate() {
	const queryClient = useQueryClient()
	const { activeOrgId } = useOrganization()

	return useMutation({
		mutationKey: ['createLeaseTemplate'],
		networkMode: 'online',
		mutationFn: (payload: CreateLeaseTemplatePayload) => {
			const requestId = stableRequestId(['createLeaseTemplate'], payload)
			return leaseTemplatesApi.create(payload, {
				[IDEMPOTENCY_HEADER]: requestId,
			})
		},
		onMutate: async (payload) => {
			await queryClient.cancelQueries({
				queryKey: leaseTemplateKeys.lists(activeOrgId!),
			})
			const previousTemplates = queryClient.getQueryData<Array<LeaseTemplate>>(
				leaseTemplateKeys.list(activeOrgId!),
			)
			const optimistic = applyCreate(queryClient, payload, activeOrgId!)
			return { previousTemplates, optimisticId: optimistic.id }
		},
		onError: (err, _, context) => {
			if (context?.previousTemplates) {
				queryClient.setQueryData(
					leaseTemplateKeys.list(activeOrgId!),
					context.previousTemplates,
				)
			}
			console.error('[Mutation] Create lease template failed:', err)
		},
		onSettled: () => {
			queryClient.invalidateQueries({
				queryKey: leaseTemplateKeys.all(activeOrgId!),
			})
		},
	})
}

export function useUpdateLeaseTemplate() {
	const queryClient = useQueryClient()
	const { activeOrgId } = useOrganization()

	return useMutation({
		mutationKey: ['updateLeaseTemplate'],
		networkMode: 'online',
		mutationFn: async ({
			id,
			payload,
		}: {
			id: string
			payload: UpdateLeaseTemplatePayload
		}) => {
			const variables = { id, payload }
			const requestId = stableRequestId(['updateLeaseTemplate'], variables)
			return leaseTemplatesApi.update(id, payload, {
				[IDEMPOTENCY_HEADER]: requestId,
			})
		},
		onMutate: async ({ id, payload }) => {
			await queryClient.cancelQueries({
				queryKey: leaseTemplateKeys.all(activeOrgId!),
			})
			const previousTemplates = queryClient.getQueryData<Array<LeaseTemplate>>(
				leaseTemplateKeys.list(activeOrgId!),
			)
			const previousTemplate = queryClient.getQueryData<LeaseTemplate>(
				leaseTemplateKeys.detail(activeOrgId!, id),
			)

			applyUpdate(queryClient, id, payload, activeOrgId!)

			return { previousTemplates, previousTemplate }
		},
		onError: (err, { id }, context) => {
			if (context?.previousTemplates) {
				queryClient.setQueryData(
					leaseTemplateKeys.list(activeOrgId!),
					context.previousTemplates,
				)
			}
			if (context?.previousTemplate) {
				queryClient.setQueryData(
					leaseTemplateKeys.detail(activeOrgId!, id),
					context.previousTemplate,
				)
			}
			console.error('[Mutation] Update lease template failed:', err)
		},
		onSettled: (_, __, { id }) => {
			queryClient.invalidateQueries({
				queryKey: leaseTemplateKeys.detail(activeOrgId!, id),
			})
			queryClient.invalidateQueries({
				queryKey: leaseTemplateKeys.all(activeOrgId!),
			})
		},
	})
}

export function useDeleteLeaseTemplate() {
	const queryClient = useQueryClient()
	const { activeOrgId } = useOrganization()

	return useMutation({
		mutationKey: ['deleteLeaseTemplate'],
		networkMode: 'online',
		mutationFn: async (id: string) => {
			const requestId = stableRequestId(['deleteLeaseTemplate'], id)
			return leaseTemplatesApi.delete(id, { [IDEMPOTENCY_HEADER]: requestId })
		},
		onMutate: async (id) => {
			await queryClient.cancelQueries({
				queryKey: leaseTemplateKeys.all(activeOrgId!),
			})
			const previousTemplates = queryClient.getQueryData<Array<LeaseTemplate>>(
				leaseTemplateKeys.list(activeOrgId!),
			)
			const previousTemplate = queryClient.getQueryData<LeaseTemplate>(
				leaseTemplateKeys.detail(activeOrgId!, id),
			)
			applyDelete(queryClient, id, activeOrgId!)
			return { previousTemplates, previousTemplate }
		},
		onError: (err, id, context) => {
			if (context?.previousTemplates) {
				queryClient.setQueryData(
					leaseTemplateKeys.list(activeOrgId!),
					context.previousTemplates,
				)
			}
			if (context?.previousTemplate) {
				queryClient.setQueryData(
					leaseTemplateKeys.detail(activeOrgId!, id),
					context.previousTemplate,
				)
			}
			console.error('[Mutation] Delete lease template failed:', err)
		},
		onSettled: () => {
			queryClient.invalidateQueries({
				queryKey: leaseTemplateKeys.all(activeOrgId!),
			})
		},
	})
}
