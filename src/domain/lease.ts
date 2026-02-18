// --- Enums ---

export const LeaseStatus = {
	DRAFT: 'DRAFT',
	REVIEW: 'REVIEW',
	SIGNED: 'SIGNED',
	ACTIVE: 'ACTIVE',
	EXPIRED: 'EXPIRED',
	TERMINATED: 'TERMINATED',
	EVICTED: 'EVICTED',
} as const

export type LeaseStatus = (typeof LeaseStatus)[keyof typeof LeaseStatus]

export const LEASE_STATUSES: ReadonlyArray<LeaseStatus> =
	Object.values(LeaseStatus)

export const LateFeeType = {
	FLAT_FEE: 'FLAT_FEE',
	PERCENTAGE: 'PERCENTAGE',
} as const

export type LateFeeType = (typeof LateFeeType)[keyof typeof LateFeeType]

export const LATE_FEE_TYPES: ReadonlyArray<LateFeeType> =
	Object.values(LateFeeType)

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
	templateParameters: Record<string, string> | null
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
	tenantEmails: Array<string>
	startDate: string
	endDate: string
	rentAmount: number
	rentDueDay: number
	securityDepositHeld?: number | null
	/** Overrides the template default if provided */
	lateFeeType?: LateFeeType | null
	lateFeeAmount?: number | null
	noticePeriodDays?: number | null
	templateParameters?: Record<string, string>
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
	templateParameters?: Record<string, string> | null
	additionalMetadata?: Record<string, unknown> | null
	version: number
}
