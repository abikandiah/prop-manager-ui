export const membershipKeys = {
	all: ['memberships'] as const,
	lists: () => [...membershipKeys.all, 'list'] as const,
	list: (orgId: string) => [...membershipKeys.lists(), orgId] as const,
	details: () => [...membershipKeys.all, 'detail'] as const,
	detail: (orgId: string, id: string) =>
		[...membershipKeys.details(), orgId, id] as const,
}
