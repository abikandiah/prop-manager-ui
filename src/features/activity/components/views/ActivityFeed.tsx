import type { ActivityEventType } from '@/domain/activity'
import { Skeleton } from '@abumble/design-system/components/Skeleton'
import { useActivityFeed } from '../../hooks'
import { ActivityFeedItem } from './ActivityFeedItem'

interface ActivityFeedProps {
	filter?: ActivityEventType[]
	limit?: number
}

export function ActivityFeed({ filter, limit = 10 }: ActivityFeedProps) {
	const { data, isLoading, isError } = useActivityFeed(0, filter)

	if (isLoading) {
		return (
			<div className="divide-y">
				{Array.from({ length: 3 }).map((_, i) => (
					<div key={i} className="flex items-center gap-3">
						<Skeleton className="h-4 w-4 shrink-0 rounded-full" />
						<Skeleton className="h-4 flex-1" />
						<Skeleton className="h-4 w-12 shrink-0" />
					</div>
				))}
			</div>
		)
	}

	if (isError) {
		return (
			<p className="text-center text-sm text-muted-foreground">
				Activity unavailable.
			</p>
		)
	}

	const events = (data?.content ?? []).slice(0, limit)

	if (events.length === 0) {
		return (
			<p className="text-center text-sm text-muted-foreground">
				No recent activity.
			</p>
		)
	}

	return (
		<div className="max-h-80 divide-y overflow-y-auto">
			{events.map((event) => (
				<ActivityFeedItem key={event.id} event={event} />
			))}
		</div>
	)
}
