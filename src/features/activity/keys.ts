import type { ActivityEventType } from '@/domain/activity'

export const activityKeys = {
	all: (orgId: string) => ['org', orgId, 'activity'] as const,
	feed: (orgId: string, page = 0, filter?: ActivityEventType[]) =>
		[...activityKeys.all(orgId), 'feed', page, filter ?? []] as const,
}
