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
