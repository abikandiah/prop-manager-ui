import { useQuery } from '@tanstack/react-query'
import { tenantKeys } from './keys'
import { tenantsApi } from './api'
import { useOrganization } from '@/contexts/organization'

export function useTenantsList() {
	const { activeOrgId } = useOrganization()
	return useQuery({
		queryKey: tenantKeys.list(activeOrgId!),
		queryFn: () => tenantsApi.list(),
		enabled: !!activeOrgId,
	})
}

export function useTenantDetail(id: string | null) {
	const { activeOrgId } = useOrganization()
	return useQuery({
		queryKey: tenantKeys.detail(activeOrgId!, id!),
		queryFn: () => tenantsApi.getById(id!),
		enabled: !!activeOrgId && id != null,
	})
}
