import type { QueryClient } from '@tanstack/react-query'
import type { CreatePropPayload, Prop, UpdatePropPayload } from '@/api/props'
import { propKeys } from '@/api/query-keys'

/** ID used for optimistic create entries until synced (TanStack will re-run mutation when back online). */
export const OPTIMISTIC_PROP_ID = -1

function nowIso(): string {
	return new Date().toISOString()
}

/** Apply optimistic create to cache (used in onMutate when offline; mutation will be paused and persisted). */
export function applyOptimisticCreate(
	queryClient: QueryClient,
	payload: CreatePropPayload,
): Prop {
	const optimistic: Prop = {
		id: OPTIMISTIC_PROP_ID,
		name: payload.name,
		description: payload.description ?? null,
		createdAt: nowIso(),
		updatedAt: nowIso(),
	}
	queryClient.setQueryData(propKeys.list(), (old: Prop[] | undefined) =>
		old ? [...old, optimistic] : [optimistic],
	)
	return optimistic
}

/** Apply optimistic update to cache. */
export function applyOptimisticUpdate(
	queryClient: QueryClient,
	id: number,
	payload: UpdatePropPayload,
): void {
	const updatedAt = nowIso()
	queryClient.setQueryData(propKeys.list(), (old: Prop[] | undefined) =>
		old?.map((p) => (p.id === id ? { ...p, ...payload, updatedAt } : p)) ?? [],
	)
	queryClient.setQueryData(propKeys.detail(id), (old: Prop | undefined) =>
		old ? { ...old, ...payload, updatedAt } : undefined,
	)
}

/** Apply optimistic delete to cache. */
export function applyOptimisticDelete(queryClient: QueryClient, id: number): void {
	queryClient.setQueryData(propKeys.list(), (old: Prop[] | undefined) =>
		old?.filter((p) => p.id !== id) ?? [],
	)
	queryClient.removeQueries({ queryKey: propKeys.detail(id) })
}
