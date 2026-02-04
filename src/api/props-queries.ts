import {
	useMutation,
	useQuery,
	useQueryClient,
} from '@tanstack/react-query'
import {
	propsApi,
	IDEMPOTENCY_HEADER,
	type CreatePropPayload,
	type Prop,
	type UpdatePropPayload,
} from '@/api/props'
import { propKeys } from '@/api/query-keys'
import {
	applyOptimisticCreate,
	applyOptimisticUpdate,
	applyOptimisticDelete,
	OPTIMISTIC_PROP_ID,
} from '@/api/prop-mutations'
import { stableRequestId } from '@/lib/offline-types'

export function usePropsList() {
	return useQuery({
		queryKey: propKeys.list(),
		queryFn: () => propsApi.list(),
	})
}

export function usePropDetail(id: number | null) {
	return useQuery({
		queryKey: propKeys.detail(id!),
		queryFn: () => propsApi.getById(id!),
		enabled: id != null,
	})
}

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
			const previousProps = queryClient.getQueryData<Prop[]>(propKeys.list())

			// Always apply optimistic update for "snappy" UI
			applyOptimisticCreate(queryClient, payload)

			return { previousProps }
		},
		onError: (err, _, context) => {
			if (context?.previousProps) {
				queryClient.setQueryData(propKeys.list(), context.previousProps)
			}
			console.error('[Mutation] Create failed:', err)
		},
		onSuccess: (data) => {
			// If synced successfully (not the optimistic placeholder), refresh from server
			if (data.id !== OPTIMISTIC_PROP_ID) {
				queryClient.invalidateQueries({ queryKey: propKeys.all })
			}
		},
	})
}

export function useUpdateProp() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationKey: ['updateProp'],
		networkMode: 'online',
		mutationFn: ({ id, payload }: { id: number; payload: UpdatePropPayload }) => {
			const variables = { id, payload }
			const requestId = stableRequestId(['updateProp'], variables)
			return propsApi.update(id, payload, { [IDEMPOTENCY_HEADER]: requestId })
		},
		onMutate: async ({ id, payload }) => {
			await queryClient.cancelQueries({ queryKey: propKeys.all })
			const previousProps = queryClient.getQueryData<Prop[]>(propKeys.list())
			const previousProp = queryClient.getQueryData<Prop>(propKeys.detail(id))

			applyOptimisticUpdate(queryClient, id, payload)

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
		mutationFn: (id: number) => {
			const requestId = stableRequestId(['deleteProp'], id)
			return propsApi.delete(id, { [IDEMPOTENCY_HEADER]: requestId })
		},
		onMutate: async (id) => {
			await queryClient.cancelQueries({ queryKey: propKeys.all })
			const previousProps = queryClient.getQueryData<Prop[]>(propKeys.list())
			const previousProp = queryClient.getQueryData<Prop>(propKeys.detail(id))

			applyOptimisticDelete(queryClient, id)

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
