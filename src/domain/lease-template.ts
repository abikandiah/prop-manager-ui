import type { LateFeeType } from './lease'

// --- LeaseTemplate Entity ---

export interface LeaseTemplate {
	id: string
	name: string
	versionTag: string | null
	version: number
	templateMarkdown: string
	templateParameters: Record<string, string>
	defaultLateFeeType: LateFeeType | null
	defaultLateFeeAmount: number | null
	defaultNoticePeriodDays: number | null
	active: boolean
	createdAt: string
	updatedAt: string
}

// --- LeaseTemplate Requests ---

export interface CreateLeaseTemplatePayload {
	id: string // Client-generated UUID for idempotency
	name: string
	versionTag?: string | null
	templateMarkdown: string
	templateParameters?: Record<string, string>
	defaultLateFeeType?: LateFeeType | null
	defaultLateFeeAmount?: number | null
	defaultNoticePeriodDays?: number | null
}

export interface UpdateLeaseTemplatePayload {
	name?: string
	versionTag?: string | null
	templateMarkdown?: string
	templateParameters?: Record<string, string>
	defaultLateFeeType?: LateFeeType | null
	defaultLateFeeAmount?: number | null
	defaultNoticePeriodDays?: number | null
	active?: boolean
	/** Required for optimistic-lock verification */
	version: number
}
