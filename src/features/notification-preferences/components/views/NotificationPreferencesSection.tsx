import { SectionCard } from '@/components/ui/SectionCard'
import { Switch } from '@/components/ui/switch'
import {
	NotificationChannel,
	NotificationType,
	type NotificationPreference,
} from '@/domain/notification-preference'
import { Badge } from '@abumble/design-system/components/Badge'
import { Skeleton } from '@abumble/design-system/components/Skeleton'
import { useMemo } from 'react'
import {
	useNotificationPreferences,
	useUpdateNotificationPreference,
} from '../../hooks'

interface NotificationTypeConfig {
	type: NotificationType
	label: string
	description: string
}

const LEASE_NOTIFICATIONS: NotificationTypeConfig[] = [
	{
		type: NotificationType.LEASE_SUBMITTED_FOR_REVIEW,
		label: 'Lease submitted for review',
		description: 'A lease has been submitted and is awaiting review.',
	},
	{
		type: NotificationType.LEASE_ACTIVATED,
		label: 'Lease activated',
		description: 'A lease has been signed by all parties and is now active.',
	},
	{
		type: NotificationType.LEASE_EXPIRING_SOON,
		label: 'Lease expiring soon',
		description: 'A lease is approaching its end date.',
	},
	{
		type: NotificationType.LEASE_TENANT_SIGNED,
		label: 'Tenant signed',
		description: 'A tenant has signed the lease agreement.',
	},
	{
		type: NotificationType.LEASE_ALL_SIGNED,
		label: 'All parties signed',
		description: 'Everyone has signed — the lease is ready to activate.',
	},
	{
		type: NotificationType.LEASE_EXPIRED,
		label: 'Lease expired',
		description: 'A lease has passed its end date.',
	},
	{
		type: NotificationType.LEASE_TERMINATED,
		label: 'Lease terminated',
		description: 'A lease has been ended early.',
	},
	{
		type: NotificationType.LEASE_EVICTED,
		label: 'Eviction notice',
		description: 'A tenant has been issued an eviction notice.',
	},
]

function PreferenceRow({
	config,
	preference,
}: {
	config: NotificationTypeConfig
	preference: NotificationPreference | undefined
}) {
	const { mutate: updatePreference } = useUpdateNotificationPreference()
	const enabled = preference?.enabled ?? true
	const optOutAllowed = preference?.optOutAllowed ?? false

	function handleToggle(checked: boolean) {
		updatePreference({
			notificationType: config.type,
			channel: NotificationChannel.EMAIL,
			enabled: checked,
		})
	}

	return (
		<div className="flex items-start justify-between gap-4 py-3">
			<div className="space-y-0.5 min-w-0">
				<div className="flex items-center gap-2">
					<p className="text-sm font-medium leading-none">{config.label}</p>
					{!optOutAllowed && (
						<Badge variant="secondary" className="text-xs">
							Required
						</Badge>
					)}
				</div>
				<p className="text-sm text-muted-foreground">{config.description}</p>
			</div>
			<Switch
				checked={enabled}
				onCheckedChange={handleToggle}
				disabled={!optOutAllowed}
				aria-label={config.label}
			/>
		</div>
	)
}

function NotificationPreferencesSkeleton() {
	return (
		<div className="space-y-6 p-1">
			{Array.from({ length: 4 }).map((_, i) => (
				<div key={i} className="flex items-center justify-between py-3">
					<div className="space-y-1.5">
						<Skeleton className="h-4 w-40" />
						<Skeleton className="h-3.5 w-64" />
					</div>
					<Skeleton className="h-5 w-9 rounded-full" />
				</div>
			))}
		</div>
	)
}

/** Displays and manages the current user's email notification preferences. */
export function NotificationPreferencesSection() {
	const { data: preferences, isLoading } = useNotificationPreferences()
	const prefMap = useMemo(
		() => new Map(preferences?.map((p) => [p.notificationType, p]) ?? []),
		[preferences],
	)

	return (
		<SectionCard
			title="Email notifications"
			description="Choose which emails you receive. Required notifications can't be turned off."
		>
			{isLoading || !preferences ? (
				<NotificationPreferencesSkeleton />
			) : (
				<div className="divide-y pt-2">
					{LEASE_NOTIFICATIONS.map((item) => (
						<PreferenceRow
							key={item.type}
							config={item}
							preference={prefMap.get(item.type)}
						/>
					))}
				</div>
			)}
		</SectionCard>
	)
}
