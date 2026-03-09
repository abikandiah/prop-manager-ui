import { Link } from '@tanstack/react-router'
import type { LucideIcon } from 'lucide-react'
import {
	AlertTriangle,
	Ban,
	Building2,
	CalendarX,
	CheckCircle2,
	CircleCheck,
	Clock,
	PenLine,
	Send,
	UserCheck,
} from 'lucide-react'
import { cn } from '@abumble/design-system/utils'
import type { ActivityEvent, ActivityEventType } from '@/domain/activity'
import { ActivitySubjectType } from '@/domain/activity'
import { formatTimeAgo } from '@/lib/format'

interface IconConfig {
	icon: LucideIcon
	colorClass: string
}

const ICON_MAP: Record<ActivityEventType, IconConfig> = {
	LEASE_SUBMITTED_FOR_REVIEW: { icon: Send, colorClass: 'text-blue-500' },
	LEASE_TENANT_SIGNED: { icon: PenLine, colorClass: 'text-blue-500' },
	LEASE_ALL_TENANTS_SIGNED: {
		icon: CheckCircle2,
		colorClass: 'text-green-500',
	},
	LEASE_ACTIVATED: { icon: CircleCheck, colorClass: 'text-green-500' },
	LEASE_EXPIRING_SOON: { icon: Clock, colorClass: 'text-yellow-500' },
	LEASE_EXPIRED: { icon: CalendarX, colorClass: 'text-muted-foreground' },
	LEASE_TERMINATED: { icon: Ban, colorClass: 'text-muted-foreground' },
	LEASE_EVICTED: { icon: AlertTriangle, colorClass: 'text-destructive' },
	ORGANIZATION_CREATED: { icon: Building2, colorClass: 'text-primary' },
	INVITE_ACCEPTED: { icon: UserCheck, colorClass: 'text-green-500' },
}

function EventLink({
	event,
	children,
}: {
	event: ActivityEvent
	children: React.ReactNode
}) {
	if (event.subjectType === ActivitySubjectType.LEASE && event.subjectId) {
		return (
			<Link
				to="/leases/agreements/$leaseId"
				params={{ leaseId: event.subjectId }}
				className="hover:underline"
			>
				{children}
			</Link>
		)
	}
	return <>{children}</>
}

export function ActivityFeedItem({ event }: { event: ActivityEvent }) {
	const config = ICON_MAP[event.eventType]
	const Icon = config.icon

	return (
		<div className="flex items-start gap-3">
			<Icon className={cn('mt-0.5 h-4 w-4 shrink-0', config.colorClass)} />
			<div className="min-w-0 flex-1">
				<p className="text-sm">
					<EventLink event={event}>{event.description}</EventLink>
				</p>
			</div>
			<span className="shrink-0 text-xs text-muted-foreground">
				{formatTimeAgo(event.createdAt)}
			</span>
		</div>
	)
}
