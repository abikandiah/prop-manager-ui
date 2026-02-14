// --- Enums ---

export const LEASE_STATUSES = [
	'DRAFT',
	'PENDING_REVIEW',
	'ACTIVE',
	'TERMINATED',
	'EXPIRED',
	'EVICTED',
] as const
export type LeaseStatus = (typeof LEASE_STATUSES)[number]

export const LATE_FEE_TYPES = ['FLAT_FEE', 'PERCENTAGE'] as const
export type LateFeeType = (typeof LATE_FEE_TYPES)[number]

// --- Lease Entity ---

export interface Lease {
	id: string
	leaseTemplateId: string | null
	leaseTemplateName: string | null
	leaseTemplateVersionTag: string | null
	unitId: string
	propertyId: string
	status: LeaseStatus
	version: number
	startDate: string
	endDate: string
	rentAmount: number
	executedContentMarkdown: string | null
	signedPdfUrl: string | null
	rentDueDay: number
	securityDepositHeld: number | null
	lateFeeType: LateFeeType | null
	lateFeeAmount: number | null
	noticePeriodDays: number | null
	additionalMetadata: Record<string, unknown> | null
	createdAt: string
	updatedAt: string
}

// --- Lease Requests ---

/** Stamps a new lease from a template */
export interface CreateLeasePayload {
	id: string // Client-generated UUID for idempotency
	leaseTemplateId: string
	unitId: string
	propertyId: string
	startDate: string
	endDate: string
	rentAmount: number
	rentDueDay: number
	securityDepositHeld?: number | null
	/** Overrides the template default if provided */
	lateFeeType?: LateFeeType | null
	lateFeeAmount?: number | null
	noticePeriodDays?: number | null
	additionalMetadata?: Record<string, unknown> | null
}

/** Partial update for a DRAFT lease. Only DRAFT leases can be modified. */
export interface UpdateLeasePayload {
	startDate?: string
	endDate?: string
	rentAmount?: number
	rentDueDay?: number
	securityDepositHeld?: number | null
	lateFeeType?: LateFeeType | null
	lateFeeAmount?: number | null
	noticePeriodDays?: number | null
	/** Allow the owner to tweak the stamped content before sending for review */
	executedContentMarkdown?: string | null
	additionalMetadata?: Record<string, unknown> | null
	/** Required for optimistic-lock verification */
	version: number
}
