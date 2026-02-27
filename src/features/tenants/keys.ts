export const tenantKeys = {
	all: (orgId: string) => ['org', orgId, 'tenants'] as const,
	lists: (orgId: string) => [...tenantKeys.all(orgId), 'list'] as const,
	list: (orgId: string) => tenantKeys.lists(orgId),
	details: (orgId: string) => [...tenantKeys.all(orgId), 'detail'] as const,
	detail: (orgId: string, id: string) =>
		[...tenantKeys.details(orgId), id] as const,
}
