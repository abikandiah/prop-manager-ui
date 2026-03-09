import { api } from '@/api/client'
import type { ActivityEventType, ActivityFeedPage } from '@/domain/activity'

// orgId is injected automatically by the axios interceptor
export const activityApi = {
	getFeed: (page = 0, size = 20, eventTypes?: ActivityEventType[]) =>
		api
			.get<ActivityFeedPage>('/activity', {
				params: {
					page,
					size,
					...(eventTypes?.length ? { eventTypes: eventTypes.join(',') } : {}),
				},
			})
			.then((r) => r.data),
}
