import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { propKeys } from './keys'
import { propsApi } from './api'
import type {
	CreatePropPayload,
	CreatePropRequest,
	Prop,
	UpdatePropPayload,
} from '@/domain/property'
import { stableRequestId } from '@/lib/offline-types'
import { generateId, nowIso } from '@/lib/util'
import { IDEMPOTENCY_HEADER } from '@/lib/constants'
import { useOrganization } from '@/contexts/organization'

/** Payload for create without id (hook adds it for optimistic update; request body matches CreatePropRequest). */
export type CreatePropPayloadWithoutId = CreatePropRequest

// --- Helpers: Optimistic Updates ---

function applyCreate(
	queryClient: ReturnType<typeof useQueryClient>,
	payload: CreatePropPayload,
	orgId: string,
): Prop {
	const optimistic: Prop = {
		id: payload.id, // Use client-generated ID from payload
		legalName: payload.legalName,
		addressId: '',
		address: null,
		propertyType: payload.propertyType,
		description: payload.description ?? null,
		parcelNumber: payload.parcelNumber ?? null,
		ownerId: payload.ownerId ?? null,
		totalArea: payload.totalArea ?? null,
		yearBuilt: payload.yearBuilt ?? null,
		createdAt: nowIso(),
		updatedAt: nowIso(),
		version: 0,
	}
	queryClient.setQueryData(
		propKeys.list(orgId),
		(old: Array<Prop> | undefined) =>
			old ? [...old, optimistic] : [optimistic],
	)
	return optimistic
}

function applyUpdate(
	queryClient: ReturnType<typeof useQueryClient>,
	id: string,
	payload: UpdatePropPayload,
	orgId: string,
): void {
	const updatedAt = nowIso()
	// Omit nested address from cache merge; server response will have full address
	const { address: _addr, ...propFields } = payload
	queryClient.setQueryData(
		propKeys.list(orgId),
		(old: Array<Prop> | undefined) =>
			old?.map((p) =>
				p.id === id
					? {
							...p,
							...propFields,
							updatedAt,
							address: _addr != null ? null : p.address,
							version: p.version + 1,
						}
					: p,
			) ?? [],
	)
	queryClient.setQueryData(
		propKeys.detail(orgId, id),
		(old: Prop | undefined) =>
			old
				? {
						...old,
						...propFields,
						updatedAt,
						address: _addr != null ? null : old.address,
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
		propKeys.list(orgId),
		(old: Array<Prop> | undefined) => old?.filter((p) => p.id !== id) ?? [],
	)
	queryClient.removeQueries({ queryKey: propKeys.detail(orgId, id) })
}

// --- Queries ---

export function usePropsList() {
	const { activeOrgId } = useOrganization()
	return useQuery({
		queryKey: propKeys.list(activeOrgId!),
		queryFn: () => propsApi.list(),
		enabled: !!activeOrgId,
	})
}

export function usePropDetail(id: string | null) {
	const { activeOrgId } = useOrganization()
	return useQuery({
		queryKey: propKeys.detail(activeOrgId!, id!),
		queryFn: () => propsApi.getById(id!),
		enabled: !!activeOrgId && id != null,
	})
}

export function usePropUnits(propId: string | null) {
	const { activeOrgId } = useOrganization()
	return useQuery({
		queryKey: propKeys.units(activeOrgId!, propId!),
		queryFn: () => propsApi.listUnits(propId!),
		enabled: !!activeOrgId && propId != null,
	})
}

// --- Mutations ---

export function useCreateProp() {
	const queryClient = useQueryClient()
	const { activeOrgId } = useOrganization()

	const mutation = useMutation({
		mutationKey: ['createProp'],
		networkMode: 'online',
		mutationFn: (payload: CreatePropPayload) => {
			const requestId = stableRequestId(['createProp'], payload)
			const { id: _id, ...body } = payload
			return propsApi.create(body, { [IDEMPOTENCY_HEADER]: requestId })
		},
		onMutate: async (payload: CreatePropPayload) => {
			await queryClient.cancelQueries({ queryKey: propKeys.list(activeOrgId!) })
			const previousProps = queryClient.getQueryData<Array<Prop>>(
				propKeys.list(activeOrgId!),
			)
			const optimistic = applyCreate(queryClient, payload, activeOrgId!)
			return { previousProps, optimisticId: optimistic.id }
		},
		onError: (err, _, context) => {
			if (context?.previousProps) {
				queryClient.setQueryData(
					propKeys.list(activeOrgId!),
					context.previousProps,
				)
			}
			console.error('[Mutation] Create failed:', err)
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: propKeys.all(activeOrgId!) })
		},
	})

	return {
		...mutation,
		mutate: (
			payload: CreatePropPayloadWithoutId,
			options?: Parameters<typeof mutation.mutate>[1],
		) => mutation.mutate({ ...payload, id: generateId() }, options),
		mutateAsync: (
			payload: CreatePropPayloadWithoutId,
			options?: Parameters<typeof mutation.mutateAsync>[1],
		) => mutation.mutateAsync({ ...payload, id: generateId() }, options),
	}
}

export function useUpdateProp() {
	const queryClient = useQueryClient()
	const { activeOrgId } = useOrganization()

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
			await queryClient.cancelQueries({ queryKey: propKeys.all(activeOrgId!) })
			const previousProps = queryClient.getQueryData<Array<Prop>>(
				propKeys.list(activeOrgId!),
			)
			const previousProp = queryClient.getQueryData<Prop>(
				propKeys.detail(activeOrgId!, id),
			)
			applyUpdate(queryClient, id, payload, activeOrgId!)
			return { previousProps, previousProp }
		},
		onError: (err, { id }, context) => {
			if (context?.previousProps) {
				queryClient.setQueryData(
					propKeys.list(activeOrgId!),
					context.previousProps,
				)
			}
			if (context?.previousProp) {
				queryClient.setQueryData(
					propKeys.detail(activeOrgId!, id),
					context.previousProp,
				)
			}
			console.error('[Mutation] Update failed:', err)
		},
		onSettled: (_, __, { id }) => {
			queryClient.invalidateQueries({
				queryKey: propKeys.detail(activeOrgId!, id),
			})
			queryClient.invalidateQueries({ queryKey: propKeys.list(activeOrgId!) })
		},
	})
}

export function useDeleteProp() {
	const queryClient = useQueryClient()
	const { activeOrgId } = useOrganization()

	return useMutation({
		mutationKey: ['deleteProp'],
		networkMode: 'online',
		mutationFn: async (id: string) => {
			const requestId = stableRequestId(['deleteProp'], id)
			return propsApi.delete(id, { [IDEMPOTENCY_HEADER]: requestId })
		},
		onMutate: async (id) => {
			await queryClient.cancelQueries({ queryKey: propKeys.all(activeOrgId!) })
			const previousProps = queryClient.getQueryData<Array<Prop>>(
				propKeys.list(activeOrgId!),
			)
			const previousProp = queryClient.getQueryData<Prop>(
				propKeys.detail(activeOrgId!, id),
			)
			applyDelete(queryClient, id, activeOrgId!)
			return { previousProps, previousProp }
		},
		onError: (err, id, context) => {
			if (context?.previousProps) {
				queryClient.setQueryData(
					propKeys.list(activeOrgId!),
					context.previousProps,
				)
			}
			if (context?.previousProp) {
				queryClient.setQueryData(
					propKeys.detail(activeOrgId!, id),
					context.previousProp,
				)
			}
			console.error('[Mutation] Delete failed:', err)
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: propKeys.all(activeOrgId!) })
		},
	})
}
