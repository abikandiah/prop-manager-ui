import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { unitKeys, unitsApi } from './units'
import type { CreateUnitPayload, Unit, UpdateUnitPayload } from './units'

// --- Queries ---

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
		mutationFn: (payload: CreateUnitPayload) => unitsApi.create(payload),
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
		mutationFn: ({
			id,
			payload,
		}: {
			id: string
			payload: UpdateUnitPayload
		}) => unitsApi.update(id, payload),
		onSuccess: (data) => {
			queryClient.invalidateQueries({
				queryKey: unitKeys.list(data.propertyId),
			})
			queryClient.invalidateQueries({
				queryKey: unitKeys.detail(data.id),
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
		mutationFn: (id: string) => unitsApi.delete(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: unitKeys.all })
		},
	})
}
