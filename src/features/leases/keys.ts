import type { LeaseStatus } from '@/domain/lease'

export const leaseKeys = {
	all: ['leases'] as const,
	lists: () => [...leaseKeys.all, 'list'] as const,
	list: (filters?: {
		unitId?: string | null
		propertyId?: string | null
		status?: LeaseStatus | null
	}) => {
		if (!filters || (!filters.unitId && !filters.propertyId && !filters.status)) {
			return ['leases', 'list'] as const
		}
		const parts: Array<string | number | null | undefined> = ['leases', 'list']
		if (filters.unitId) parts.push('unit', filters.unitId)
		if (filters.propertyId) parts.push('property', filters.propertyId)
		if (filters.status) parts.push('status', filters.status)
		return parts as ReadonlyArray<string | number | null | undefined>
	},
	details: () => [...leaseKeys.all, 'detail'] as const,
	detail: (id: string) => [...leaseKeys.details(), id] as const,
}
