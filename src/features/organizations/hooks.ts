import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { organizationsApi } from './api'
import { organizationKeys } from './keys'
import type {
	Organization,
	CreateOrganizationPayload,
	UpdateOrganizationPayload,
} from '@/domain/organization'
import { stableRequestId } from '@/lib/offline-types'
import { generateId, nowIso } from '@/lib/util'
import { IDEMPOTENCY_HEADER } from '@/lib/constants'

/** Payload without id — the hook generates it. */
export type CreateOrganizationPayloadWithoutId = Omit<
	CreateOrganizationPayload,
	'id'
>

// --- Queries ---

export function useOrganizationsList() {
	return useQuery({
		queryKey: organizationKeys.list(),
		queryFn: () => organizationsApi.list(),
	})
}

export function useOrganizationById(id: string | null) {
	return useQuery({
		queryKey: organizationKeys.detail(id!),
		queryFn: () => organizationsApi.getById(id!),
		enabled: id != null,
	})
}

// --- Mutations ---

export function useCreateOrganization() {
	const queryClient = useQueryClient()

	const mutation = useMutation({
		mutationKey: ['createOrganization'],
		networkMode: 'online',
		mutationFn: (payload: CreateOrganizationPayload) => {
			const requestId = stableRequestId(['createOrganization'], payload)
			return organizationsApi.create(payload, {
				[IDEMPOTENCY_HEADER]: requestId,
			})
		},
		onMutate: async (payload: CreateOrganizationPayload) => {
			await queryClient.cancelQueries({
				queryKey: organizationKeys.list(),
			})
			const previous = queryClient.getQueryData<Organization[]>(
				organizationKeys.list(),
			)
			const optimistic: Organization = {
				id: payload.id,
				name: payload.name,
				settings: payload.settings ?? {},
				version: 0,
				createdAt: nowIso(),
				updatedAt: nowIso(),
			}
			queryClient.setQueryData(
				organizationKeys.list(),
				(old: Organization[] | undefined) =>
					old ? [...old, optimistic] : [optimistic],
			)
			return { previous }
		},
		onError: (_err, _payload, context) => {
			if (context?.previous) {
				queryClient.setQueryData(organizationKeys.list(), context.previous)
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: organizationKeys.all,
			})
		},
	})

	return {
		...mutation,
		mutate: (
			payload: CreateOrganizationPayloadWithoutId,
			options?: Parameters<typeof mutation.mutate>[1],
		) => mutation.mutate({ ...payload, id: generateId() }, options),
		mutateAsync: (
			payload: CreateOrganizationPayloadWithoutId,
			options?: Parameters<typeof mutation.mutateAsync>[1],
		) => mutation.mutateAsync({ ...payload, id: generateId() }, options),
	}
}

export function useUpdateOrganization() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationKey: ['updateOrganization'],
		networkMode: 'online',
		mutationFn: ({
			id,
			payload,
		}: {
			id: string
			payload: UpdateOrganizationPayload
		}) => {
			const requestId = stableRequestId(['updateOrganization', id], payload)
			return organizationsApi.update(id, payload, {
				[IDEMPOTENCY_HEADER]: requestId,
			})
		},
		onSettled: (_, __, { id }) => {
			queryClient.invalidateQueries({
				queryKey: organizationKeys.detail(id),
			})
			queryClient.invalidateQueries({
				queryKey: organizationKeys.list(),
			})
		},
	})
}

export function useDeleteOrganization() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationKey: ['deleteOrganization'],
		networkMode: 'online',
		mutationFn: (id: string) => {
			const requestId = stableRequestId(['deleteOrganization'], id)
			return organizationsApi.delete(id, {
				[IDEMPOTENCY_HEADER]: requestId,
			})
		},
		onMutate: async (id) => {
			await queryClient.cancelQueries({
				queryKey: organizationKeys.list(),
			})
			const previous = queryClient.getQueryData<Organization[]>(
				organizationKeys.list(),
			)
			queryClient.setQueryData(
				organizationKeys.list(),
				(old: Organization[] | undefined) =>
					old?.filter((o) => o.id !== id) ?? [],
			)
			queryClient.removeQueries({
				queryKey: organizationKeys.detail(id),
			})
			return { previous }
		},
		onError: (_err, _id, context) => {
			if (context?.previous) {
				queryClient.setQueryData(organizationKeys.list(), context.previous)
			}
		},
		onSettled: () => {
			queryClient.invalidateQueries({
				queryKey: organizationKeys.all,
			})
		},
	})
}
