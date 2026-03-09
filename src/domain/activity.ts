export const ActivitySubjectType = {
	LEASE: 'LEASE',
	ORGANIZATION: 'ORGANIZATION',
	INVITE: 'INVITE',
} as const
export type ActivitySubjectType =
	(typeof ActivitySubjectType)[keyof typeof ActivitySubjectType]

export const ActivityEventType = {
	LEASE_SUBMITTED_FOR_REVIEW: 'LEASE_SUBMITTED_FOR_REVIEW',
	LEASE_TENANT_SIGNED: 'LEASE_TENANT_SIGNED',
	LEASE_ALL_TENANTS_SIGNED: 'LEASE_ALL_TENANTS_SIGNED',
	LEASE_ACTIVATED: 'LEASE_ACTIVATED',
	LEASE_EXPIRING_SOON: 'LEASE_EXPIRING_SOON',
	LEASE_EXPIRED: 'LEASE_EXPIRED',
	LEASE_TERMINATED: 'LEASE_TERMINATED',
	LEASE_EVICTED: 'LEASE_EVICTED',
	ORGANIZATION_CREATED: 'ORGANIZATION_CREATED',
	INVITE_ACCEPTED: 'INVITE_ACCEPTED',
} as const

export type ActivityEventType =
	(typeof ActivityEventType)[keyof typeof ActivityEventType]

export interface ActivityEvent {
	id: string
	orgId: string
	eventType: ActivityEventType
	subjectType: ActivitySubjectType
	subjectId: string | null
	actorId: string | null
	metadata: Record<string, unknown> | null
	version: number
	createdAt: string
	updatedAt: string
	description: string
}

export interface ActivityFeedPage {
	content: ActivityEvent[]
	page: number
	size: number
	totalElements: number
	totalPages: number
}
