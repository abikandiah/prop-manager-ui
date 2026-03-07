export const tenantPortalKeys = {
	all: (orgId: string) => ['org', orgId, 'tenant-portal'] as const,
	myLease: (orgId: string) => [...tenantPortalKeys.all(orgId), 'my-lease'] as const,
	myProfile: (orgId: string) => [...tenantPortalKeys.all(orgId), 'my-profile'] as const,
}
