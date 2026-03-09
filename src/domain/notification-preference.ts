export const NotificationType = {
	INVITE_LEASE: 'INVITE_LEASE',
	INVITE_PROPERTY: 'INVITE_PROPERTY',
	ACCOUNT_CREATED: 'ACCOUNT_CREATED',
	LEASE_SUBMITTED_FOR_REVIEW: 'LEASE_SUBMITTED_FOR_REVIEW',
	LEASE_ACTIVATED: 'LEASE_ACTIVATED',
	LEASE_EXPIRING_SOON: 'LEASE_EXPIRING_SOON',
	LEASE_TENANT_SIGNED: 'LEASE_TENANT_SIGNED',
	LEASE_ALL_SIGNED: 'LEASE_ALL_SIGNED',
	LEASE_EXPIRED: 'LEASE_EXPIRED',
	LEASE_TERMINATED: 'LEASE_TERMINATED',
	LEASE_EVICTED: 'LEASE_EVICTED',
} as const

export type NotificationType =
	(typeof NotificationType)[keyof typeof NotificationType]

export const NotificationChannel = {
	EMAIL: 'EMAIL',
} as const

export type NotificationChannel =
	(typeof NotificationChannel)[keyof typeof NotificationChannel]

export interface NotificationPreference {
	/** Null when the preference has never been explicitly set (server returns a synthetic default). */
	id: string | null
	/** Null for synthetic defaults that haven't been persisted yet. */
	version: number | null
	notificationType: NotificationType
	channel: NotificationChannel
	enabled: boolean
	/** When false, this notification cannot be disabled. */
	optOutAllowed: boolean
}

export interface UpdateNotificationPreferencePayload {
	notificationType: NotificationType
	channel: NotificationChannel
	enabled: boolean
}
