import type { LateFeeType } from './lease'

// --- LeaseTemplate Entity ---

export interface LeaseTemplate {
	id: string
	name: string
	versionTag: string | null
	version: number
	templateMarkdown: string
	defaultLateFeeType: LateFeeType | null
	defaultLateFeeAmount: number | null
	defaultNoticePeriodDays: number | null
	active: boolean
	createdAt: string
	updatedAt: string
}

// --- LeaseTemplate Requests ---

export interface CreateLeaseTemplatePayload {
	name: string
	versionTag?: string | null
	templateMarkdown: string
	defaultLateFeeType?: LateFeeType | null
	defaultLateFeeAmount?: number | null
	defaultNoticePeriodDays?: number | null
}

export interface UpdateLeaseTemplatePayload {
	name?: string
	versionTag?: string | null
	templateMarkdown?: string
	defaultLateFeeType?: LateFeeType | null
	defaultLateFeeAmount?: number | null
	defaultNoticePeriodDays?: number | null
	active?: boolean
	/** Required for optimistic-lock verification */
	version: number
}
