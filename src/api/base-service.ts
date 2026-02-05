import { api } from './client'

export class BaseService<T, TCreatePayload = any, TUpdatePayload = any> {
	constructor(protected endpoint: string) {
		// Ensure endpoint starts with a slash but doesn't end with one
		this.endpoint = '/' + endpoint.replace(/^\/|\/$/g, '')
	}

	async list(): Promise<Array<T>> {
		const res = await api.get<Array<T>>(this.endpoint)
		return res.data
	}

	async getById(id: string): Promise<T> {
		const res = await api.get<T>(`${this.endpoint}/${id}`)
		return res.data
	}

	async create(
		payload: TCreatePayload,
		headers?: Record<string, string>,
	): Promise<T> {
		const res = await api.post<T>(this.endpoint, payload, { headers })
		return res.data
	}

	async update(
		id: string,
		payload: TUpdatePayload,
		headers?: Record<string, string>,
	): Promise<T> {
		const res = await api.patch<T>(`${this.endpoint}/${id}`, payload, {
			headers,
		})
		return res.data
	}

	async delete(id: string, headers?: Record<string, string>): Promise<void> {
		await api.delete(`${this.endpoint}/${id}`, { headers })
	}
}
