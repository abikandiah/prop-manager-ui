import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { IDEMPOTENCY_HEADER, propKeys, propsApi } from './props'
import type { CreatePropPayload, Prop, UpdatePropPayload } from './props'
import { stableRequestId } from '@/lib/offline-types'
import { generateOptimisticId, nowIso } from '@/lib/util'

// --- Helpers: Optimistic Updates ---

function applyCreate(
	queryClient: ReturnType<typeof useQueryClient>,
	payload: CreatePropPayload,
): Prop {
	const optimistic: Prop = {
		id: generateOptimisticId(),
		legalName: payload.legalName,
		addressId: '', // unknown until server responds
		address: null,
		propertyType: payload.propertyType,
		description: payload.description ?? null,
		parcelNumber: payload.parcelNumber ?? null,
		ownerId: payload.ownerId ?? null,
		totalArea: payload.totalArea ?? null,
		yearBuilt: payload.yearBuilt ?? null,
		createdAt: nowIso(),
		updatedAt: nowIso(),
	}
	queryClient.setQueryData(propKeys.list(), (old: Array<Prop> | undefined) =>
		old ? [...old, optimistic] : [optimistic],
	)
	return optimistic
}

function applyUpdate(
	queryClient: ReturnType<typeof useQueryClient>,
	id: string,
	payload: UpdatePropPayload,
): void {
	const updatedAt = nowIso()
	// Omit nested address from cache merge; server response will have full address
	const { address: _addr, ...propFields } = payload
	queryClient.setQueryData(
		propKeys.list(),
		(old: Array<Prop> | undefined) =>
			old?.map((p) =>
				p.id === id
					? {
							...p,
							...propFields,
							updatedAt,
							address: _addr != null ? null : p.address,
						}
					: p,
			) ?? [],
	)
	queryClient.setQueryData(propKeys.detail(id), (old: Prop | undefined) =>
		old
			? {
					...old,
					...propFields,
					updatedAt,
					address: _addr != null ? null : old.address,
				}
			: undefined,
	)
}

function applyDelete(
	queryClient: ReturnType<typeof useQueryClient>,
	id: string,
): void {
	queryClient.setQueryData(
		propKeys.list(),
		(old: Array<Prop> | undefined) => old?.filter((p) => p.id !== id) ?? [],
	)
	queryClient.removeQueries({ queryKey: propKeys.detail(id) })
}

// --- Queries ---

export function usePropsList() {
	return useQuery({
		queryKey: propKeys.list(),
		queryFn: () => propsApi.list(),
	})
}

export function usePropDetail(id: string | null) {
	return useQuery({
		queryKey: propKeys.detail(id!),
		queryFn: () => propsApi.getById(id!),
		enabled: id != null,
	})
}

// --- Mutations ---

export function useCreateProp() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationKey: ['createProp'],
		networkMode: 'online',
		mutationFn: (payload: CreatePropPayload) => {
			const requestId = stableRequestId(['createProp'], payload)
			return propsApi.create(payload, { [IDEMPOTENCY_HEADER]: requestId })
		},
		onMutate: async (payload) => {
			await queryClient.cancelQueries({ queryKey: propKeys.list() })
			const previousProps = queryClient.getQueryData<Array<Prop>>(
				propKeys.list(),
			)
			const optimistic = applyCreate(queryClient, payload)
			return { previousProps, optimisticId: optimistic.id }
		},
		onError: (err, _, context) => {
			if (context?.previousProps) {
				queryClient.setQueryData(propKeys.list(), context.previousProps)
			}
			console.error('[Mutation] Create failed:', err)
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: propKeys.all })
		},
	})
}

export function useUpdateProp() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationKey: ['updateProp'],
		networkMode: 'online',
		mutationFn: async ({
			id,
			payload,
		}: {
			id: string
			payload: UpdatePropPayload
		}) => {
			const variables = { id, payload }
			const requestId = stableRequestId(['updateProp'], variables)
			return propsApi.update(id, payload, { [IDEMPOTENCY_HEADER]: requestId })
		},
		onMutate: async ({ id, payload }) => {
			await queryClient.cancelQueries({ queryKey: propKeys.all })
			const previousProps = queryClient.getQueryData<Array<Prop>>(
				propKeys.list(),
			)
			const previousProp = queryClient.getQueryData<Prop>(propKeys.detail(id))
			applyUpdate(queryClient, id, payload)
			return { previousProps, previousProp }
		},
		onError: (err, { id }, context) => {
			if (context?.previousProps) {
				queryClient.setQueryData(propKeys.list(), context.previousProps)
			}
			if (context?.previousProp) {
				queryClient.setQueryData(propKeys.detail(id), context.previousProp)
			}
			console.error('[Mutation] Update failed:', err)
		},
		onSettled: (_, __, { id }) => {
			queryClient.invalidateQueries({ queryKey: propKeys.detail(id) })
			queryClient.invalidateQueries({ queryKey: propKeys.list() })
		},
	})
}

export function useDeleteProp() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationKey: ['deleteProp'],
		networkMode: 'online',
		mutationFn: async (id: string) => {
			const requestId = stableRequestId(['deleteProp'], id)
			return propsApi.delete(id, { [IDEMPOTENCY_HEADER]: requestId })
		},
		onMutate: async (id) => {
			await queryClient.cancelQueries({ queryKey: propKeys.all })
			const previousProps = queryClient.getQueryData<Array<Prop>>(
				propKeys.list(),
			)
			const previousProp = queryClient.getQueryData<Prop>(propKeys.detail(id))
			applyDelete(queryClient, id)
			return { previousProps, previousProp }
		},
		onError: (err, id, context) => {
			if (context?.previousProps) {
				queryClient.setQueryData(propKeys.list(), context.previousProps)
			}
			if (context?.previousProp) {
				queryClient.setQueryData(propKeys.detail(id), context.previousProp)
			}
			console.error('[Mutation] Delete failed:', err)
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: propKeys.all })
		},
	})
}
