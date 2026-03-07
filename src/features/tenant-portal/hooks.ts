import { useOrganization } from '@/contexts/organization'
import type { UpdateTenantPayload } from '@/domain/tenant'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isApiError } from '@/api/errors'
import { tenantPortalApi } from './api'
import { tenantPortalKeys } from './keys'

/** Returns the current tenant's lease view for the active org. */
export function useMyLease() {
	const { activeOrgId } = useOrganization()
	return useQuery({
		queryKey: tenantPortalKeys.myLease(activeOrgId!),
		queryFn: tenantPortalApi.getMyLease,
		enabled: !!activeOrgId,
		// Persistence: Keep lease data in local IndexedDB for 7 days for moving-day resilience.
		// staleTime remains at global default (5m) to ensure freshness when signal is available.
		gcTime: 7 * 24 * 60 * 60 * 1000,
		// No retry on 404 — means no active lease in this org, not a transient error
		retry: (failureCount, error) => {
			if (isApiError(error) && error.status === 404) return false
			return failureCount < 3
		},
	})
}

/** Returns the current user's tenant profile. Renders section only on 200 (404 = not a tenant yet). */
export function useMyTenantProfile() {
	const { activeOrgId } = useOrganization()
	return useQuery({
		queryKey: tenantPortalKeys.myProfile(activeOrgId!),
		queryFn: tenantPortalApi.getMyTenantProfile,
		enabled: !!activeOrgId,
		retry: (failureCount, error) => {
			if (isApiError(error) && error.status === 404) return false
			return failureCount < 3
		},
	})
}

/** Updates the current user's tenant profile via PATCH /api/tenants/me. */
export function useUpdateMyTenantProfile() {
	const queryClient = useQueryClient()
	const { activeOrgId } = useOrganization()
	return useMutation({
		mutationKey: ['updateMyTenantProfile'],
		networkMode: 'online',
		mutationFn: (payload: UpdateTenantPayload) =>
			tenantPortalApi.updateMyTenantProfile(payload),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: tenantPortalKeys.myProfile(activeOrgId!),
			})
		},
	})
}
