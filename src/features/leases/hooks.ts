import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { leaseKeys, leaseTenantKeys } from './keys'
import { leasesApi, leaseTenantApi } from './api'
import type {
	CreateLeasePayload,
	Lease,
	UpdateLeasePayload,
} from '@/domain/lease'
import { LeaseStatus } from '@/domain/lease'
import type {
	InviteLeaseTenantPayload,
	LeaseTenant,
} from '@/domain/lease-tenant'
import { stableRequestId } from '@/lib/offline-types'
import { nowIso } from '@/lib/util'
import { IDEMPOTENCY_HEADER } from '@/lib/constants'

// --- Helpers: Optimistic Updates ---

function applyCreate(
	queryClient: ReturnType<typeof useQueryClient>,
	payload: CreateLeasePayload,
): Lease {
	const optimistic: Lease = {
		id: payload.id, // ✅ Use client-generated ID from payload
		leaseTemplateId: payload.leaseTemplateId,
		leaseTemplateName: null,
		leaseTemplateVersionTag: null,
		unitId: payload.unitId,
		propertyId: payload.propertyId,
		status: LeaseStatus.DRAFT,
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
		templateParameters: payload.templateParameters ?? null,
		createdAt: nowIso(),
		updatedAt: nowIso(),
	}

	// Update unfiltered list
	queryClient.setQueryData(leaseKeys.list(), (old: Array<Lease> | undefined) =>
		old ? [...old, optimistic] : [optimistic],
	)

	// Update unit list
	queryClient.setQueryData(
		leaseKeys.list({ unitId: payload.unitId }),
		(old: Array<Lease> | undefined) =>
			old ? [...old, optimistic] : [optimistic],
	)

	// Update property list
	queryClient.setQueryData(
		leaseKeys.list({ propertyId: payload.propertyId }),
		(old: Array<Lease> | undefined) =>
			old ? [...old, optimistic] : [optimistic],
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
	queryClient.setQueryData(
		leaseKeys.detail(lease.id),
		(old: Lease | undefined) =>
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
		networkMode: 'online',
		mutationFn: (payload: CreateLeasePayload) => {
			const requestId = stableRequestId(['createLease'], payload)
			return leasesApi.create(payload, { [IDEMPOTENCY_HEADER]: requestId })
		},
		onMutate: async (payload) => {
			await queryClient.cancelQueries({ queryKey: leaseKeys.lists() })
			const previousAllLeases = queryClient.getQueryData<Array<Lease>>(
				leaseKeys.list(),
			)
			const previousUnitLeases = queryClient.getQueryData<Array<Lease>>(
				leaseKeys.list({ unitId: payload.unitId }),
			)
			const previousPropertyLeases = queryClient.getQueryData<Array<Lease>>(
				leaseKeys.list({ propertyId: payload.propertyId }),
			)
			const optimistic = applyCreate(queryClient, payload)
			return {
				previousAllLeases,
				previousUnitLeases,
				previousPropertyLeases,
				optimisticId: optimistic.id,
			}
		},
		onError: (err, payload, context) => {
			if (context?.previousAllLeases) {
				queryClient.setQueryData(leaseKeys.list(), context.previousAllLeases)
			}
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
		networkMode: 'online',
		mutationFn: async ({ id, payload }: UpdateLeaseVariables) => {
			const variables = { id, payload }
			const requestId = stableRequestId(['updateLease'], variables)
			return leasesApi.update(id, payload, { [IDEMPOTENCY_HEADER]: requestId })
		},
		onMutate: async ({
			id,
			payload,
			unitId: varUnitId,
			propertyId: varPropertyId,
		}) => {
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
		networkMode: 'online',
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

function makeLeaseStatusTransitionHook(
	mutationKey: string,
	mutationFn: (id: string) => Promise<Lease>,
	newStatus: LeaseStatus,
	errorLabel: string,
) {
	return function useLeaseStatusTransition() {
		const queryClient = useQueryClient()

		return useMutation({
			mutationKey: [mutationKey],
			networkMode: 'online',
			mutationFn,
			onMutate: async (id: string) => {
				const currentLease = queryClient.getQueryData<Lease>(
					leaseKeys.detail(id),
				)
				if (!currentLease) return

				await queryClient.cancelQueries({ queryKey: leaseKeys.all })
				const previousUnitLeases = queryClient.getQueryData<Array<Lease>>(
					leaseKeys.list({ unitId: currentLease.unitId }),
				)
				const previousPropertyLeases = queryClient.getQueryData<Array<Lease>>(
					leaseKeys.list({ propertyId: currentLease.propertyId }),
				)
				const previousLease = currentLease

				applyStatusChange(queryClient, currentLease, newStatus)

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
				console.error(`[Mutation] ${errorLabel} failed:`, err)
			},
			onSettled: () => {
				queryClient.invalidateQueries({ queryKey: leaseKeys.all })
			},
		})
	}
}

export const useSubmitLeaseForReview = makeLeaseStatusTransitionHook(
	'submitLeaseForReview',
	(id) => leasesApi.submitForReview(id),
	LeaseStatus.REVIEW,
	'Submit lease for review',
)

export const useActivateLease = makeLeaseStatusTransitionHook(
	'activateLease',
	(id) => leasesApi.activate(id),
	LeaseStatus.ACTIVE,
	'Activate lease',
)

export const useRevertLeaseToDraft = makeLeaseStatusTransitionHook(
	'revertLeaseToDraft',
	(id) => leasesApi.revertToDraft(id),
	LeaseStatus.DRAFT,
	'Revert lease to draft',
)

export const useTerminateLease = makeLeaseStatusTransitionHook(
	'terminateLease',
	(id) => leasesApi.terminate(id),
	LeaseStatus.TERMINATED,
	'Terminate lease',
)

// --- Lease Tenant Queries ---

/** Fetch all tenants for a single lease. */
export function useLeaseTenants(leaseId: string | null) {
	return useQuery({
		queryKey: leaseTenantKeys.list(leaseId!),
		queryFn: () => leaseTenantApi.listByLeaseId(leaseId!),
		enabled: leaseId != null,
	})
}

// --- Lease Tenant Mutations ---

export type InviteTenantsVariables = {
	leaseId: string
	payload: InviteLeaseTenantPayload
}

/**
 * Invite one or more tenants to a DRAFT lease.
 * No optimistic update — the server creates both the Invite and LeaseTenant records atomically,
 * so we invalidate on settle to show the real server state.
 */
export function useInviteLeaseTenants() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationKey: ['inviteLeaseTenants'],
		networkMode: 'online',
		mutationFn: ({ leaseId, payload }: InviteTenantsVariables) => {
			const requestId = stableRequestId(['inviteLeaseTenants'], {
				leaseId,
				...payload,
			})
			return leaseTenantApi.invite(leaseId, payload, {
				[IDEMPOTENCY_HEADER]: requestId,
			})
		},
		onError: (err) => {
			console.error('[Mutation] Invite lease tenants failed:', err)
		},
		onSettled: (_data, _error, { leaseId }) => {
			queryClient.invalidateQueries({
				queryKey: leaseTenantKeys.list(leaseId),
			})
		},
	})
}

export type ResendLeaseTenantInviteVariables = {
	leaseId: string
	leaseTenantId: string
	/** Used to build the success toast message. */
	email: string
}

/**
 * Resend the invite for a lease tenant who hasn't accepted yet.
 * Error messages come directly from the server's ProblemDetail.detail
 * (e.g. cooldown: "Please wait before resending this invitation").
 */
export function useResendLeaseTenantInvite() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationKey: ['resendLeaseTenantInvite'],
		networkMode: 'online',
		mutationFn: ({
			leaseId,
			leaseTenantId,
		}: ResendLeaseTenantInviteVariables) => {
			const requestId = stableRequestId(['resendLeaseTenantInvite'], {
				leaseId,
				leaseTenantId,
			})
			return leaseTenantApi.resendInvite(leaseId, leaseTenantId, {
				[IDEMPOTENCY_HEADER]: requestId,
			})
		},
		onError: (err) => {
			console.error('[Mutation] Resend lease tenant invite failed:', err)
		},
		onSettled: (_data, _error, { leaseId }) => {
			queryClient.invalidateQueries({
				queryKey: leaseTenantKeys.list(leaseId),
			})
		},
	})
}

export type RemoveLeaseTenantVariables = {
	leaseId: string
	leaseTenantId: string
}

/**
 * Remove a tenant from a DRAFT lease (only permitted when they haven't signed).
 * Optimistically removes the row from cache; rolls back on error.
 */
export function useRemoveLeaseTenant() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationKey: ['removeLeaseTenant'],
		networkMode: 'online',
		mutationFn: ({ leaseId, leaseTenantId }: RemoveLeaseTenantVariables) => {
			const requestId = stableRequestId(['removeLeaseTenant'], {
				leaseId,
				leaseTenantId,
			})
			return leaseTenantApi.remove(leaseId, leaseTenantId, {
				[IDEMPOTENCY_HEADER]: requestId,
			})
		},
		onMutate: async ({ leaseId, leaseTenantId }) => {
			await queryClient.cancelQueries({
				queryKey: leaseTenantKeys.list(leaseId),
			})
			const previous = queryClient.getQueryData<Array<LeaseTenant>>(
				leaseTenantKeys.list(leaseId),
			)
			queryClient.setQueryData(
				leaseTenantKeys.list(leaseId),
				(old: Array<LeaseTenant> | undefined) =>
					old?.filter((t) => t.id !== leaseTenantId) ?? [],
			)
			return { previous }
		},
		onError: (err, { leaseId }, context) => {
			if (context?.previous) {
				queryClient.setQueryData(
					leaseTenantKeys.list(leaseId),
					context.previous,
				)
			}
			console.error('[Mutation] Remove lease tenant failed:', err)
		},
		onSettled: (_data, _error, { leaseId }) => {
			queryClient.invalidateQueries({
				queryKey: leaseTenantKeys.list(leaseId),
			})
		},
	})
}
