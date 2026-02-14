import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { unitKeys } from './keys'
import { unitsApi } from './api'
import type { CreateUnitPayload, Unit, UpdateUnitPayload } from '@/domain/unit'
import { stableRequestId } from '@/lib/offline-types'
import { nowIso } from '@/lib/util'
import { IDEMPOTENCY_HEADER } from '@/lib/constants'

// --- Helpers: Optimistic Updates ---

function applyCreate(
	queryClient: ReturnType<typeof useQueryClient>,
	payload: CreateUnitPayload,
): Unit {
	const optimistic: Unit = {
		id: payload.id, // ✅ Use client-generated ID from payload
		propertyId: payload.propertyId,
		unitNumber: payload.unitNumber,
		status: payload.status,
		description: payload.description ?? null,
		rentAmount: payload.rentAmount ?? null,
		securityDeposit: payload.securityDeposit ?? null,
		bedrooms: payload.bedrooms ?? null,
		bathrooms: payload.bathrooms ?? null,
		squareFootage: payload.squareFootage ?? null,
		balcony: payload.balcony ?? null,
		laundryInUnit: payload.laundryInUnit ?? null,
		hardwoodFloors: payload.hardwoodFloors ?? null,
		createdAt: nowIso(),
		updatedAt: nowIso(),
		version: 0,
	}
	queryClient.setQueryData(
		unitKeys.list(payload.propertyId),
		(old: Array<Unit> | undefined) => (old ? [...old, optimistic] : [optimistic]),
	)
	return optimistic
}

function applyUpdate(
	queryClient: ReturnType<typeof useQueryClient>,
	id: string,
	payload: UpdateUnitPayload,
	previousPropertyId: string,
): void {
	const updatedAt = nowIso()
	const { version: _version, ...unitFields } = payload
	const newPropertyId = payload.propertyId ?? previousPropertyId

	// Update list cache for old property
	queryClient.setQueryData(
		unitKeys.list(previousPropertyId),
		(old: Array<Unit> | undefined) =>
			old?.map((u) =>
				u.id === id
					? {
							...u,
							...unitFields,
							updatedAt,
							version: u.version + 1,
						}
					: u,
			) ?? [],
	)

	// If property changed, update list cache for new property
	if (payload.propertyId && payload.propertyId !== previousPropertyId) {
		queryClient.setQueryData(
			unitKeys.list(newPropertyId),
			(old: Array<Unit> | undefined) =>
				old?.map((u) =>
					u.id === id
						? {
								...u,
								...unitFields,
								updatedAt,
								version: u.version + 1,
							}
						: u,
				) ?? [],
		)
	}

	// Update detail cache
	queryClient.setQueryData(unitKeys.detail(id), (old: Unit | undefined) =>
		old
			? {
					...old,
					...unitFields,
					updatedAt,
					version: old.version + 1,
				}
			: undefined,
	)
}

function applyDelete(
	queryClient: ReturnType<typeof useQueryClient>,
	id: string,
	propertyId: string,
): void {
	queryClient.setQueryData(
		unitKeys.list(propertyId),
		(old: Array<Unit> | undefined) => old?.filter((u) => u.id !== id) ?? [],
	)
	queryClient.removeQueries({ queryKey: unitKeys.detail(id) })
}

// --- Queries ---

export function useUnitsList() {
	return useQuery({
		queryKey: unitKeys.list(null),
		queryFn: () => unitsApi.list(),
	})
}

export function useUnitsByPropId(propId: string | null) {
	return useQuery({
		queryKey: unitKeys.list(propId),
		queryFn: () => unitsApi.listByPropId(propId!),
		enabled: propId != null,
	})
}

export function useUnitDetail(id: string | null) {
	return useQuery({
		queryKey: unitKeys.detail(id!),
		queryFn: () => unitsApi.getById(id!),
		enabled: id != null,
	})
}

// --- Mutations ---

export function useCreateUnit() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationKey: ['createUnit'],
		networkMode: 'online',
		mutationFn: (payload: CreateUnitPayload) => {
			const requestId = stableRequestId(['createUnit'], payload)
			return unitsApi.create(payload, { [IDEMPOTENCY_HEADER]: requestId })
		},
		onMutate: async (payload) => {
			await queryClient.cancelQueries({
				queryKey: unitKeys.list(payload.propertyId),
			})
			const previousUnits = queryClient.getQueryData<Array<Unit>>(
				unitKeys.list(payload.propertyId),
			)
			const optimistic = applyCreate(queryClient, payload)
			return { previousUnits, optimisticId: optimistic.id }
		},
		onError: (err, payload, context) => {
			if (context?.previousUnits) {
				queryClient.setQueryData(
					unitKeys.list(payload.propertyId),
					context.previousUnits,
				)
			}
			console.error('[Mutation] Create failed:', err)
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({
				queryKey: unitKeys.list(data.propertyId),
			})
			queryClient.invalidateQueries({ queryKey: unitKeys.all })
		},
	})
}

export function useUpdateUnit() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationKey: ['updateUnit'],
		networkMode: 'online',
		mutationFn: async ({
			id,
			payload,
		}: {
			id: string
			payload: UpdateUnitPayload
		}) => {
			const variables = { id, payload }
			const requestId = stableRequestId(['updateUnit'], variables)
			return unitsApi.update(id, payload, { [IDEMPOTENCY_HEADER]: requestId })
		},
		onMutate: async ({ id, payload }) => {
			// Get the current unit to know its propertyId
			const currentUnit = queryClient.getQueryData<Unit>(unitKeys.detail(id))
			const propertyId = currentUnit?.propertyId ?? payload.propertyId ?? ''

			await queryClient.cancelQueries({ queryKey: unitKeys.all })
			const previousUnits = queryClient.getQueryData<Array<Unit>>(
				unitKeys.list(propertyId),
			)
			const previousUnit = queryClient.getQueryData<Unit>(unitKeys.detail(id))

			if (propertyId) {
				applyUpdate(queryClient, id, payload, propertyId)
			}

			return { previousUnits, previousUnit, propertyId }
		},
		onError: (err, { id }, context) => {
			if (context?.previousUnits && context?.propertyId) {
				queryClient.setQueryData(
					unitKeys.list(context.propertyId),
					context.previousUnits,
				)
			}
			if (context?.previousUnit) {
				queryClient.setQueryData(unitKeys.detail(id), context.previousUnit)
			}
			console.error('[Mutation] Update failed:', err)
		},
		onSettled: (data, _, { id }) => {
			if (data) {
				queryClient.invalidateQueries({
					queryKey: unitKeys.list(data.propertyId),
				})
			}
			queryClient.invalidateQueries({
				queryKey: unitKeys.detail(id),
			})
			queryClient.invalidateQueries({ queryKey: unitKeys.all })
		},
	})
}

export function useDeleteUnit() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationKey: ['deleteUnit'],
		networkMode: 'online',
		mutationFn: async (variables: { id: string; propertyId: string }) => {
			const requestId = stableRequestId(['deleteUnit'], variables.id)
			return unitsApi.delete(variables.id, {
				[IDEMPOTENCY_HEADER]: requestId,
			})
		},
		onMutate: async (variables) => {
			await queryClient.cancelQueries({ queryKey: unitKeys.all })
			const previousUnits = queryClient.getQueryData<Array<Unit>>(
				unitKeys.list(variables.propertyId),
			)
			const previousUnit = queryClient.getQueryData<Unit>(
				unitKeys.detail(variables.id),
			)
			applyDelete(queryClient, variables.id, variables.propertyId)
			return { previousUnits, previousUnit, propertyId: variables.propertyId }
		},
		onError: (err, variables, context) => {
			if (context?.previousUnits && context?.propertyId) {
				queryClient.setQueryData(
					unitKeys.list(context.propertyId),
					context.previousUnits,
				)
			}
			if (context?.previousUnit) {
				queryClient.setQueryData(
					unitKeys.detail(variables.id),
					context.previousUnit,
				)
			}
			console.error('[Mutation] Delete failed:', err)
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: unitKeys.all })
		},
	})
}
