import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { leaseKeys } from './keys'
import { leasesApi } from './api'
import type { CreateLeasePayload, Lease, UpdateLeasePayload } from '@/domain/lease'
import { stableRequestId } from '@/lib/offline-types'
import { generateOptimisticId, nowIso } from '@/lib/util'
import { IDEMPOTENCY_HEADER } from '@/lib/constants'

// --- Helpers: Optimistic Updates ---

function applyCreate(
	queryClient: ReturnType<typeof useQueryClient>,
	payload: CreateLeasePayload,
): Lease {
	const optimistic: Lease = {
		id: generateOptimisticId(),
		leaseTemplateId: payload.leaseTemplateId,
		leaseTemplateName: null,
		leaseTemplateVersionTag: null,
		unitId: payload.unitId,
		propertyId: payload.propertyId,
		status: 'DRAFT',
		version: 0,
		startDate: payload.startDate,
		endDate: payload.endDate,
		rentAmount: payload.rentAmount,
		executedContentMarkdown: null,
		signedPdfUrl: null,
		rentDueDay: payload.rentDueDay,
		securityDepositHeld: payload.securityDepositHeld ?? null,
		lateFeeType: payload.lateFeeType ?? null,
		lateFeeAmount: payload.lateFeeAmount ?? null,
		noticePeriodDays: payload.noticePeriodDays ?? null,
		additionalMetadata: payload.additionalMetadata ?? null,
		createdAt: nowIso(),
		updatedAt: nowIso(),
	}

	// Update unit list
	queryClient.setQueryData(
		leaseKeys.list({ unitId: payload.unitId }),
		(old: Array<Lease> | undefined) => (old ? [...old, optimistic] : [optimistic]),
	)

	// Update property list
	queryClient.setQueryData(
		leaseKeys.list({ propertyId: payload.propertyId }),
		(old: Array<Lease> | undefined) => (old ? [...old, optimistic] : [optimistic]),
	)

	return optimistic
}

function applyUpdate(
	queryClient: ReturnType<typeof useQueryClient>,
	id: string,
	payload: UpdateLeasePayload,
	previousUnitId: string,
	previousPropertyId: string,
): void {
	const updatedAt = nowIso()
	const { version: _version, ...leaseFields } = payload

	const updateFn = (old: Array<Lease> | undefined) =>
		old?.map((l) =>
			l.id === id
				? {
						...l,
						...leaseFields,
						updatedAt,
						version: l.version + 1,
					}
				: l,
		) ?? []

	// Update unit list
	queryClient.setQueryData(leaseKeys.list({ unitId: previousUnitId }), updateFn)

	// Update property list
	queryClient.setQueryData(
		leaseKeys.list({ propertyId: previousPropertyId }),
		updateFn,
	)

	// Update detail cache
	queryClient.setQueryData(leaseKeys.detail(id), (old: Lease | undefined) =>
		old
			? {
					...old,
					...leaseFields,
					updatedAt,
					version: old.version + 1,
				}
			: undefined,
	)
}

function applyStatusChange(
	queryClient: ReturnType<typeof useQueryClient>,
	lease: Lease,
	newStatus: Lease['status'],
): void {
	const updatedAt = nowIso()

	const updateFn = (old: Array<Lease> | undefined) =>
		old?.map((l) =>
			l.id === lease.id
				? {
						...l,
						status: newStatus,
						updatedAt,
						version: l.version + 1,
					}
				: l,
		) ?? []

	// Update all relevant list caches
	queryClient.setQueryData(leaseKeys.list({ unitId: lease.unitId }), updateFn)
	queryClient.setQueryData(
		leaseKeys.list({ propertyId: lease.propertyId }),
		updateFn,
	)

	// Update detail cache
	queryClient.setQueryData(leaseKeys.detail(lease.id), (old: Lease | undefined) =>
		old
			? {
					...old,
					status: newStatus,
					updatedAt,
					version: old.version + 1,
				}
			: undefined,
	)
}

function applyDelete(
	queryClient: ReturnType<typeof useQueryClient>,
	id: string,
	unitId: string,
	propertyId: string,
): void {
	queryClient.setQueryData(
		leaseKeys.list({ unitId }),
		(old: Array<Lease> | undefined) => old?.filter((l) => l.id !== id) ?? [],
	)
	queryClient.setQueryData(
		leaseKeys.list({ propertyId }),
		(old: Array<Lease> | undefined) => old?.filter((l) => l.id !== id) ?? [],
	)
	queryClient.removeQueries({ queryKey: leaseKeys.detail(id) })
}

// --- Queries ---

export function useLeasesList() {
	return useQuery({
		queryKey: leaseKeys.list(),
		queryFn: () => leasesApi.list(),
	})
}

export function useLeasesByUnitId(unitId: string | null) {
	return useQuery({
		queryKey: leaseKeys.list({ unitId }),
		queryFn: () => leasesApi.listByUnitId(unitId!),
		enabled: unitId != null,
	})
}

export function useLeasesByPropertyId(propertyId: string | null) {
	return useQuery({
		queryKey: leaseKeys.list({ propertyId }),
		queryFn: () => leasesApi.listByPropertyId(propertyId!),
		enabled: propertyId != null,
	})
}

export function useLeaseDetail(id: string | null) {
	return useQuery({
		queryKey: leaseKeys.detail(id!),
		queryFn: () => leasesApi.getById(id!),
		enabled: id != null,
	})
}

// --- Mutations ---

export function useCreateLease() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationKey: ['createLease'],
		networkMode: 'offlineFirst',
		mutationFn: (payload: CreateLeasePayload) => {
			const requestId = stableRequestId(['createLease'], payload)
			return leasesApi.create(payload, { [IDEMPOTENCY_HEADER]: requestId })
		},
		onMutate: async (payload) => {
			await queryClient.cancelQueries({ queryKey: leaseKeys.lists() })
			const previousUnitLeases = queryClient.getQueryData<Array<Lease>>(
				leaseKeys.list({ unitId: payload.unitId }),
			)
			const previousPropertyLeases = queryClient.getQueryData<Array<Lease>>(
				leaseKeys.list({ propertyId: payload.propertyId }),
			)
			const optimistic = applyCreate(queryClient, payload)
			return {
				previousUnitLeases,
				previousPropertyLeases,
				optimisticId: optimistic.id,
			}
		},
		onError: (err, payload, context) => {
			if (context?.previousUnitLeases) {
				queryClient.setQueryData(
					leaseKeys.list({ unitId: payload.unitId }),
					context.previousUnitLeases,
				)
			}
			if (context?.previousPropertyLeases) {
				queryClient.setQueryData(
					leaseKeys.list({ propertyId: payload.propertyId }),
					context.previousPropertyLeases,
				)
			}
			console.error('[Mutation] Create lease failed:', err)
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: leaseKeys.all })
		},
	})
}

export type UpdateLeaseVariables = {
	id: string
	payload: UpdateLeasePayload
	/** Pass when known (e.g. from form) so optimistic update/rollback works without relying on detail cache. */
	unitId?: string
	/** Pass when known (e.g. from form) so optimistic update/rollback works without relying on detail cache. */
	propertyId?: string
}

export function useUpdateLease() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationKey: ['updateLease'],
		networkMode: 'offlineFirst',
		mutationFn: async ({ id, payload }: UpdateLeaseVariables) => {
			const variables = { id, payload }
			const requestId = stableRequestId(['updateLease'], variables)
			return leasesApi.update(id, payload, { [IDEMPOTENCY_HEADER]: requestId })
		},
		onMutate: async ({ id, payload, unitId: varUnitId, propertyId: varPropertyId }) => {
			const currentLease = queryClient.getQueryData<Lease>(leaseKeys.detail(id))
			const unitId = varUnitId ?? currentLease?.unitId ?? ''
			const propertyId = varPropertyId ?? currentLease?.propertyId ?? ''

			await queryClient.cancelQueries({ queryKey: leaseKeys.all })
			const previousUnitLeases = queryClient.getQueryData<Array<Lease>>(
				leaseKeys.list({ unitId }),
			)
			const previousPropertyLeases = queryClient.getQueryData<Array<Lease>>(
				leaseKeys.list({ propertyId }),
			)
			const previousLease = currentLease

			if (unitId && propertyId) {
				applyUpdate(queryClient, id, payload, unitId, propertyId)
			}

			return {
				previousUnitLeases,
				previousPropertyLeases,
				previousLease,
				unitId,
				propertyId,
			}
		},
		onError: (err, { id }, context) => {
			if (context?.previousUnitLeases && context.unitId) {
				queryClient.setQueryData(
					leaseKeys.list({ unitId: context.unitId }),
					context.previousUnitLeases,
				)
			}
			if (context?.previousPropertyLeases && context.propertyId) {
				queryClient.setQueryData(
					leaseKeys.list({ propertyId: context.propertyId }),
					context.previousPropertyLeases,
				)
			}
			if (context?.previousLease) {
				queryClient.setQueryData(leaseKeys.detail(id), context.previousLease)
			}
			console.error('[Mutation] Update lease failed:', err)
		},
		onSettled: (_, __, { id }) => {
			queryClient.invalidateQueries({ queryKey: leaseKeys.detail(id) })
			queryClient.invalidateQueries({ queryKey: leaseKeys.all })
		},
	})
}

export function useDeleteLease() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationKey: ['deleteLease'],
		networkMode: 'offlineFirst',
		mutationFn: async (variables: {
			id: string
			unitId: string
			propertyId: string
		}) => {
			const requestId = stableRequestId(['deleteLease'], variables.id)
			return leasesApi.delete(variables.id, {
				[IDEMPOTENCY_HEADER]: requestId,
			})
		},
		onMutate: async (variables) => {
			await queryClient.cancelQueries({ queryKey: leaseKeys.all })
			const previousUnitLeases = queryClient.getQueryData<Array<Lease>>(
				leaseKeys.list({ unitId: variables.unitId }),
			)
			const previousPropertyLeases = queryClient.getQueryData<Array<Lease>>(
				leaseKeys.list({ propertyId: variables.propertyId }),
			)
			const previousLease = queryClient.getQueryData<Lease>(
				leaseKeys.detail(variables.id),
			)
			applyDelete(
				queryClient,
				variables.id,
				variables.unitId,
				variables.propertyId,
			)
			return {
				previousUnitLeases,
				previousPropertyLeases,
				previousLease,
				unitId: variables.unitId,
				propertyId: variables.propertyId,
			}
		},
		onError: (err, variables, context) => {
			if (context?.previousUnitLeases && context.unitId) {
				queryClient.setQueryData(
					leaseKeys.list({ unitId: context.unitId }),
					context.previousUnitLeases,
				)
			}
			if (context?.previousPropertyLeases && context.propertyId) {
				queryClient.setQueryData(
					leaseKeys.list({ propertyId: context.propertyId }),
					context.previousPropertyLeases,
				)
			}
			if (context?.previousLease) {
				queryClient.setQueryData(
					leaseKeys.detail(variables.id),
					context.previousLease,
				)
			}
			console.error('[Mutation] Delete lease failed:', err)
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: leaseKeys.all })
		},
	})
}

// --- Status Transition Mutations ---

export function useSubmitLeaseForReview() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationKey: ['submitLeaseForReview'],
		networkMode: 'offlineFirst',
		mutationFn: (id: string) => leasesApi.submitForReview(id),
		onMutate: async (id) => {
			const currentLease = queryClient.getQueryData<Lease>(leaseKeys.detail(id))
			if (!currentLease) return

			await queryClient.cancelQueries({ queryKey: leaseKeys.all })
			const previousUnitLeases = queryClient.getQueryData<Array<Lease>>(
				leaseKeys.list({ unitId: currentLease.unitId }),
			)
			const previousPropertyLeases = queryClient.getQueryData<Array<Lease>>(
				leaseKeys.list({ propertyId: currentLease.propertyId }),
			)
			const previousLease = currentLease

			applyStatusChange(queryClient, currentLease, 'PENDING_REVIEW')

			return { previousUnitLeases, previousPropertyLeases, previousLease }
		},
		onError: (err, id, context) => {
			if (context?.previousLease) {
				queryClient.setQueryData(
					leaseKeys.list({ unitId: context.previousLease.unitId }),
					context.previousUnitLeases,
				)
				queryClient.setQueryData(
					leaseKeys.list({ propertyId: context.previousLease.propertyId }),
					context.previousPropertyLeases,
				)
				queryClient.setQueryData(leaseKeys.detail(id), context.previousLease)
			}
			console.error('[Mutation] Submit lease for review failed:', err)
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: leaseKeys.all })
		},
	})
}

export function useActivateLease() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationKey: ['activateLease'],
		networkMode: 'offlineFirst',
		mutationFn: (id: string) => leasesApi.activate(id),
		onMutate: async (id) => {
			const currentLease = queryClient.getQueryData<Lease>(leaseKeys.detail(id))
			if (!currentLease) return

			await queryClient.cancelQueries({ queryKey: leaseKeys.all })
			const previousUnitLeases = queryClient.getQueryData<Array<Lease>>(
				leaseKeys.list({ unitId: currentLease.unitId }),
			)
			const previousPropertyLeases = queryClient.getQueryData<Array<Lease>>(
				leaseKeys.list({ propertyId: currentLease.propertyId }),
			)
			const previousLease = currentLease

			applyStatusChange(queryClient, currentLease, 'ACTIVE')

			return { previousUnitLeases, previousPropertyLeases, previousLease }
		},
		onError: (err, id, context) => {
			if (context?.previousLease) {
				queryClient.setQueryData(
					leaseKeys.list({ unitId: context.previousLease.unitId }),
					context.previousUnitLeases,
				)
				queryClient.setQueryData(
					leaseKeys.list({ propertyId: context.previousLease.propertyId }),
					context.previousPropertyLeases,
				)
				queryClient.setQueryData(leaseKeys.detail(id), context.previousLease)
			}
			console.error('[Mutation] Activate lease failed:', err)
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: leaseKeys.all })
		},
	})
}

export function useRevertLeaseToDraft() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationKey: ['revertLeaseToDraft'],
		networkMode: 'offlineFirst',
		mutationFn: (id: string) => leasesApi.revertToDraft(id),
		onMutate: async (id) => {
			const currentLease = queryClient.getQueryData<Lease>(leaseKeys.detail(id))
			if (!currentLease) return

			await queryClient.cancelQueries({ queryKey: leaseKeys.all })
			const previousUnitLeases = queryClient.getQueryData<Array<Lease>>(
				leaseKeys.list({ unitId: currentLease.unitId }),
			)
			const previousPropertyLeases = queryClient.getQueryData<Array<Lease>>(
				leaseKeys.list({ propertyId: currentLease.propertyId }),
			)
			const previousLease = currentLease

			applyStatusChange(queryClient, currentLease, 'DRAFT')

			return { previousUnitLeases, previousPropertyLeases, previousLease }
		},
		onError: (err, id, context) => {
			if (context?.previousLease) {
				queryClient.setQueryData(
					leaseKeys.list({ unitId: context.previousLease.unitId }),
					context.previousUnitLeases,
				)
				queryClient.setQueryData(
					leaseKeys.list({ propertyId: context.previousLease.propertyId }),
					context.previousPropertyLeases,
				)
				queryClient.setQueryData(leaseKeys.detail(id), context.previousLease)
			}
			console.error('[Mutation] Revert lease to draft failed:', err)
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: leaseKeys.all })
		},
	})
}

export function useTerminateLease() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationKey: ['terminateLease'],
		networkMode: 'offlineFirst',
		mutationFn: (id: string) => leasesApi.terminate(id),
		onMutate: async (id) => {
			const currentLease = queryClient.getQueryData<Lease>(leaseKeys.detail(id))
			if (!currentLease) return

			await queryClient.cancelQueries({ queryKey: leaseKeys.all })
			const previousUnitLeases = queryClient.getQueryData<Array<Lease>>(
				leaseKeys.list({ unitId: currentLease.unitId }),
			)
			const previousPropertyLeases = queryClient.getQueryData<Array<Lease>>(
				leaseKeys.list({ propertyId: currentLease.propertyId }),
			)
			const previousLease = currentLease

			applyStatusChange(queryClient, currentLease, 'TERMINATED')

			return { previousUnitLeases, previousPropertyLeases, previousLease }
		},
		onError: (err, id, context) => {
			if (context?.previousLease) {
				queryClient.setQueryData(
					leaseKeys.list({ unitId: context.previousLease.unitId }),
					context.previousUnitLeases,
				)
				queryClient.setQueryData(
					leaseKeys.list({ propertyId: context.previousLease.propertyId }),
					context.previousPropertyLeases,
				)
				queryClient.setQueryData(leaseKeys.detail(id), context.previousLease)
			}
			console.error('[Mutation] Terminate lease failed:', err)
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: leaseKeys.all })
		},
	})
}
