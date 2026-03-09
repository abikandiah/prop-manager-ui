import { useQuery } from '@tanstack/react-query'
import { useOrganization } from '@/contexts/organization'
import type { ActivityEventType } from '@/domain/activity'
import { activityApi } from './api'
import { activityKeys } from './keys'

// TODO: When GET /api/tenant/activity is built, add a useTenantActivityFeed hook
// scoped to the calling tenant's leases instead of the org-wide feed.

/** Fetches the org-wide activity feed. Requires PORTFOLIO READ permission (managers only). */
export function useActivityFeed(page = 0, filter?: ActivityEventType[]) {
	const { activeOrgId } = useOrganization()
	return useQuery({
		queryKey: activityKeys.feed(activeOrgId!, page, filter),
		queryFn: () => activityApi.getFeed(page, 20, filter),
		enabled: !!activeOrgId,
		staleTime: 60 * 1000,
	})
}
