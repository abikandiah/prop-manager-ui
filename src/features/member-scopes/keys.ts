export const memberScopeKeys = {
	all: ['member-scopes'] as const,
	lists: () => [...memberScopeKeys.all, 'list'] as const,
	list: (orgId: string, membershipId: string) =>
		[...memberScopeKeys.lists(), orgId, membershipId] as const,
	details: () => [...memberScopeKeys.all, 'detail'] as const,
	detail: (orgId: string, membershipId: string, scopeId: string) =>
		[...memberScopeKeys.details(), orgId, membershipId, scopeId] as const,
}
