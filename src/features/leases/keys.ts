import type { LeaseStatus } from '@/domain/lease'

export const leaseTenantKeys = {
	all: (orgId: string) => ['org', orgId, 'leaseTenants'] as const,
	lists: (orgId: string) => [...leaseTenantKeys.all(orgId), 'list'] as const,
	list: (orgId: string, leaseId: string) =>
		[...leaseTenantKeys.lists(orgId), leaseId] as const,
}

export const leaseKeys = {
	all: (orgId: string) => ['org', orgId, 'leases'] as const,
	lists: (orgId: string) => [...leaseKeys.all(orgId), 'list'] as const,
	list: (
		orgId: string,
		filters?: {
			unitId?: string | null
			propertyId?: string | null
			status?: LeaseStatus | null
		},
	) => {
		if (
			!filters ||
			(!filters.unitId && !filters.propertyId && !filters.status)
		) {
			return [...leaseKeys.all(orgId), 'list'] as const
		}
		const parts: Array<string | number | null | undefined> = [
			'org',
			orgId,
			'leases',
			'list',
		]
		if (filters.unitId) parts.push('unit', filters.unitId)
		if (filters.propertyId) parts.push('property', filters.propertyId)
		if (filters.status) parts.push('status', filters.status)
		return parts as ReadonlyArray<string | number | null | undefined>
	},
	details: (orgId: string) => [...leaseKeys.all(orgId), 'detail'] as const,
	detail: (orgId: string, id: string) =>
		[...leaseKeys.details(orgId), id] as const,
}
