import { InviteStatus } from '@/domain/membership'

export enum TargetType {
	LEASE = 'LEASE',
	MEMBERSHIP = 'MEMBERSHIP',
}

export { InviteStatus }

export interface Invite {
	id: string
	email: string
	token: string
	targetType: TargetType
	targetId: string
	role?: string
	status: InviteStatus
	invitedBy: string // user name
	expiresAt: string
	acceptedAt?: string
	sentAt?: string
	lastResentAt?: string
}

export interface CreateInvitePayload {
	email: string
	targetType: TargetType
	targetId: string
	role?: string // templateId for MEMBERSHIP
	metadata?: Record<string, any>
}

// ─── Preview snapshot shapes ─────────────────────────────────────────────────
// Each domain writes its own keys into attributes["preview"] at invite-creation
// time. The shapes below mirror what the backend stores.

export interface LeaseInvitePreview {
	property: {
		legalName: string
		addressLine1: string
		addressLine2?: string
		city: string
		stateProvinceRegion: string
		postalCode: string
	}
	unit: {
		unitNumber: string
		unitType?: string
	}
	lease: {
		startDate: string
		endDate: string
		rentAmount: number
	}
}

export interface MembershipInvitePreview {
	organizationName: string
}

export interface InvitePreviewResponse {
	maskedEmail: string
	status: InviteStatus
	isValid: boolean
	isExpired: boolean
	expiresAt: string
	invitedByName: string
	targetType: TargetType
	preview:
		| LeaseInvitePreview
		| MembershipInvitePreview
		| Record<string, unknown>
}
