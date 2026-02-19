export const leaseTenantKeys = {
	all: ['lease-tenants'] as const,
	byLease: (leaseId: string) =>
		[...leaseTenantKeys.all, 'list', leaseId] as const,
}
