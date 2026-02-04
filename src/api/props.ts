import { config } from '@/config'

/** Matches backend PropResponse (id, name, description, createdAt, updatedAt). */
export interface Prop {
	id: number
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

const base = () => config.apiBaseUrl.replace(/\/$/, '') + '/api/props'

export const IDEMPOTENCY_HEADER = 'X-Request-Id'

type RequestOptions = RequestInit & { parseJson?: boolean }

async function request<T>(url: string, options?: RequestOptions): Promise<T> {
	const { parseJson = true, ...init } = options ?? {}
	const merged: Record<string, string> = { 'Content-Type': 'application/json' }
	const existing = init.headers
	if (existing)
		if (existing instanceof Headers)
			existing.forEach((v, k) => (merged[k] = v))
		else if (typeof existing === 'object')
			Object.assign(merged, existing)
	const res = await fetch(url, {
		...init,
		headers: merged,
	})
	if (!res.ok) {
		const text = await res.text()
		throw new Error(text || `HTTP ${res.status}`)
	}
	if (parseJson && res.status !== 204) return res.json() as Promise<T>
	return undefined as T
}

export const propsApi = {
	list(): Promise<Prop[]> {
		return request<Prop[]>(base())
	},

	getById(id: number): Promise<Prop> {
		return request<Prop>(`${base()}/${id}`)
	},

	create(payload: CreatePropPayload, headers?: HeadersInit): Promise<Prop> {
		return request<Prop>(base(), {
			method: 'POST',
			body: JSON.stringify(payload),
			headers,
		})
	},

	update(id: number, payload: UpdatePropPayload, headers?: HeadersInit): Promise<Prop> {
		return request<Prop>(`${base()}/${id}`, {
			method: 'PATCH',
			body: JSON.stringify(payload),
			headers,
		})
	},

	delete(id: number, headers?: HeadersInit): Promise<void> {
		return request<void>(`${base()}/${id}`, {
			method: 'DELETE',
			parseJson: false,
			headers,
		})
	},
}
