import type {
	CreateLeasePayload,
	Lease,
	UpdateLeasePayload,
} from '@/domain/lease'
import { api } from '@/api/client'
import { BaseService } from '@/api/base-service'

const ENDPOINT = 'leases'

class LeasesApi extends BaseService<
	Lease,
	CreateLeasePayload,
	UpdateLeasePayload
> {
	constructor() {
		super(ENDPOINT)
	}

	async listByUnitId(unitId: string): Promise<Array<Lease>> {
		const res = await api.get<Array<Lease>>(this.endpoint, {
			params: { unitId },
		})
		return res.data
	}

	async listByPropertyId(propertyId: string): Promise<Array<Lease>> {
		const res = await api.get<Array<Lease>>(this.endpoint, {
			params: { propertyId },
		})
		return res.data
	}

	// --- Status Transition Endpoints ---

	/** Submit draft for tenant review (DRAFT → REVIEW) */
	async submitForReview(id: string): Promise<Lease> {
		const res = await api.post<Lease>(`${this.endpoint}/${id}/submit`)
		return res.data
	}

	/** Activate a reviewed lease (REVIEW → ACTIVE) */
	async activate(id: string): Promise<Lease> {
		const res = await api.post<Lease>(`${this.endpoint}/${id}/activate`)
		return res.data
	}

	/** Revert to draft for further edits (REVIEW → DRAFT) */
	async revertToDraft(id: string): Promise<Lease> {
		const res = await api.post<Lease>(`${this.endpoint}/${id}/revert`)
		return res.data
	}

	/** Terminate an active lease early (ACTIVE → TERMINATED) */
	async terminate(id: string): Promise<Lease> {
		const res = await api.post<Lease>(`${this.endpoint}/${id}/terminate`)
		return res.data
	}
}

export const leasesApi = new LeasesApi()
