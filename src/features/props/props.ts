import { BaseService } from '@/api/base-service'

// --- Constants ---
export const IDEMPOTENCY_HEADER = 'X-Request-Id'

// --- Types ---
export interface Prop {
	id: string
	name: string
	description: string | null
	createdAt: string
	updatedAt: string
}

export interface CreatePropPayload {
	name: string
	description?: string | null
}

export interface UpdatePropPayload {
	name?: string
	description?: string | null
}

// --- Service ---
class PropsApi extends BaseService<Prop, CreatePropPayload, UpdatePropPayload> {
	constructor() {
		super('/props')
	}
}
export const propsApi = new PropsApi()

// --- Query Keys ---
export const propKeys = {
	all: ['props'] as const,
	lists: () => [...propKeys.all, 'list'] as const,
	list: () => propKeys.lists(),
	details: () => [...propKeys.all, 'detail'] as const,
	detail: (id: string) => [...propKeys.details(), id] as const,
}
