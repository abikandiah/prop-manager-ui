import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { unitKeys } from './keys'
import { unitsApi } from './api'
import type { CreateUnitPayload, Unit, UpdateUnitPayload } from '@/domain/unit'
import { stableRequestId } from '@/lib/offline-types'
import { nowIso } from '@/lib/util'
import { IDEMPOTENCY_HEADER } from '@/lib/constants'
import { useOrganization } from '@/contexts/organization'

// --- Helpers: Optimistic Updates ---

function applyCreate(
	queryClient: ReturnType<typeof useQueryClient>,
	payload: CreateUnitPayload,
	orgId: string,
): Unit {
	const optimistic: Unit = {
		id: payload.id, // Use client-generated ID from payload
		propertyId: payload.propertyId,
		unitNumber: payload.unitNumber,
		unitType: payload.unitType ?? null,
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
		unitKeys.list(orgId, payload.propertyId),
		(old: Array<Unit> | undefined) =>
			old ? [...old, optimistic] : [optimistic],
	)
	return optimistic
}

function applyUpdate(
	queryClient: ReturnType<typeof useQueryClient>,
	id: string,
	payload: UpdateUnitPayload,
	previousPropertyId: string,
	orgId: string,
): void {
	const updatedAt = nowIso()
	const { version: _version, ...unitFields } = payload
	const newPropertyId = payload.propertyId ?? previousPropertyId

	// Update list cache for old property
	queryClient.setQueryData(
		unitKeys.list(orgId, previousPropertyId),
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
			unitKeys.list(orgId, newPropertyId),
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
	queryClient.setQueryData(
		unitKeys.detail(orgId, id),
		(old: Unit | undefined) =>
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
	orgId: string,
): void {
	queryClient.setQueryData(
		unitKeys.list(orgId, propertyId),
		(old: Array<Unit> | undefined) => old?.filter((u) => u.id !== id) ?? [],
	)
	queryClient.removeQueries({ queryKey: unitKeys.detail(orgId, id) })
}

// --- Queries ---

export function useUnitsList() {
	const { activeOrgId } = useOrganization()
	return useQuery({
		queryKey: unitKeys.list(activeOrgId!, null),
		queryFn: () => unitsApi.list(),
		enabled: !!activeOrgId,
	})
}

export function useUnitsByPropId(propId: string | null) {
	const { activeOrgId } = useOrganization()
	return useQuery({
		queryKey: unitKeys.list(activeOrgId!, propId),
		queryFn: () => unitsApi.list(propId!),
		enabled: !!activeOrgId && propId != null,
	})
}

export function useUnitDetail(id: string | null) {
	const { activeOrgId } = useOrganization()
	return useQuery({
		queryKey: unitKeys.detail(activeOrgId!, id!),
		queryFn: () => unitsApi.getById(id!),
		enabled: !!activeOrgId && id != null,
	})
}

// --- Mutations ---

export function useCreateUnit() {
	const queryClient = useQueryClient()
	const { activeOrgId } = useOrganization()

	return useMutation({
		mutationKey: ['createUnit'],
		networkMode: 'online',
		mutationFn: (payload: CreateUnitPayload) => {
			const requestId = stableRequestId(['createUnit'], payload)
			return unitsApi.create(payload, { [IDEMPOTENCY_HEADER]: requestId })
		},
		onMutate: async (payload) => {
			await queryClient.cancelQueries({
				queryKey: unitKeys.list(activeOrgId!, payload.propertyId),
			})
			const previousUnits = queryClient.getQueryData<Array<Unit>>(
				unitKeys.list(activeOrgId!, payload.propertyId),
			)
			const optimistic = applyCreate(queryClient, payload, activeOrgId!)
			return { previousUnits, optimisticId: optimistic.id }
		},
		onError: (err, payload, context) => {
			if (context?.previousUnits) {
				queryClient.setQueryData(
					unitKeys.list(activeOrgId!, payload.propertyId),
					context.previousUnits,
				)
			}
			console.error('[Mutation] Create failed:', err)
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({
				queryKey: unitKeys.list(activeOrgId!, data.propertyId),
			})
			queryClient.invalidateQueries({ queryKey: unitKeys.all(activeOrgId!) })
		},
	})
}

export function useUpdateUnit() {
	const queryClient = useQueryClient()
	const { activeOrgId } = useOrganization()

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
			const currentUnit = queryClient.getQueryData<Unit>(
				unitKeys.detail(activeOrgId!, id),
			)
			const propertyId = currentUnit?.propertyId ?? payload.propertyId ?? ''

			await queryClient.cancelQueries({ queryKey: unitKeys.all(activeOrgId!) })
			const previousUnits = queryClient.getQueryData<Array<Unit>>(
				unitKeys.list(activeOrgId!, propertyId),
			)
			const previousUnit = queryClient.getQueryData<Unit>(
				unitKeys.detail(activeOrgId!, id),
			)

			if (propertyId) {
				applyUpdate(queryClient, id, payload, propertyId, activeOrgId!)
			}

			return { previousUnits, previousUnit, propertyId }
		},
		onError: (err, { id }, context) => {
			if (context?.previousUnits && context.propertyId) {
				queryClient.setQueryData(
					unitKeys.list(activeOrgId!, context.propertyId),
					context.previousUnits,
				)
			}
			if (context?.previousUnit) {
				queryClient.setQueryData(
					unitKeys.detail(activeOrgId!, id),
					context.previousUnit,
				)
			}
			console.error('[Mutation] Update failed:', err)
		},
		onSettled: (data, _, { id }) => {
			if (data) {
				queryClient.invalidateQueries({
					queryKey: unitKeys.list(activeOrgId!, data.propertyId),
				})
			}
			queryClient.invalidateQueries({
				queryKey: unitKeys.detail(activeOrgId!, id),
			})
			queryClient.invalidateQueries({ queryKey: unitKeys.all(activeOrgId!) })
		},
	})
}

export function useDeleteUnit() {
	const queryClient = useQueryClient()
	const { activeOrgId } = useOrganization()

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
			await queryClient.cancelQueries({ queryKey: unitKeys.all(activeOrgId!) })
			const previousUnits = queryClient.getQueryData<Array<Unit>>(
				unitKeys.list(activeOrgId!, variables.propertyId),
			)
			const previousUnit = queryClient.getQueryData<Unit>(
				unitKeys.detail(activeOrgId!, variables.id),
			)
			applyDelete(queryClient, variables.id, variables.propertyId, activeOrgId!)
			return { previousUnits, previousUnit, propertyId: variables.propertyId }
		},
		onError: (err, variables, context) => {
			if (context?.previousUnits && context.propertyId) {
				queryClient.setQueryData(
					unitKeys.list(activeOrgId!, context.propertyId),
					context.previousUnits,
				)
			}
			if (context?.previousUnit) {
				queryClient.setQueryData(
					unitKeys.detail(activeOrgId!, variables.id),
					context.previousUnit,
				)
			}
			console.error('[Mutation] Delete failed:', err)
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: unitKeys.all(activeOrgId!) })
		},
	})
}
