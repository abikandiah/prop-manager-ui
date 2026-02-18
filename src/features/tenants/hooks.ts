import { useQuery } from '@tanstack/react-query'
import { tenantKeys } from './keys'
import { tenantsApi } from './api'

export function useTenantsList() {
	return useQuery({
		queryKey: tenantKeys.list(),
		queryFn: () => tenantsApi.list(),
	})
}

export function useTenantDetail(id: string | null) {
	return useQuery({
		queryKey: tenantKeys.detail(id!),
		queryFn: () => tenantsApi.getById(id!),
		enabled: id != null,
	})
}
