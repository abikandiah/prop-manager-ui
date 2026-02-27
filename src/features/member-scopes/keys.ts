export const memberScopeKeys = {
	all: (orgId: string) => ['org', orgId, 'member-scopes'] as const,
	lists: (orgId: string) => [...memberScopeKeys.all(orgId), 'list'] as const,
	list: (orgId: string, membershipId: string) =>
		[...memberScopeKeys.lists(orgId), membershipId] as const,
	details: (orgId: string) =>
		[...memberScopeKeys.all(orgId), 'detail'] as const,
	detail: (orgId: string, membershipId: string, scopeId: string) =>
		[...memberScopeKeys.details(orgId), membershipId, scopeId] as const,
}
