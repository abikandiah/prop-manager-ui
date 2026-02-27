export const membershipKeys = {
	all: (orgId: string) => ['org', orgId, 'memberships'] as const,
	lists: (orgId: string) => [...membershipKeys.all(orgId), 'list'] as const,
	list: (orgId: string) => membershipKeys.lists(orgId),
	details: (orgId: string) => [...membershipKeys.all(orgId), 'detail'] as const,
	detail: (orgId: string, id: string) =>
		[...membershipKeys.details(orgId), id] as const,
}
