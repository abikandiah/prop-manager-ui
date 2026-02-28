export const permissionPolicyKeys = {
	all: (orgId: string) => ['org', orgId, 'permission-policies'] as const,
	lists: (orgId: string) =>
		[...permissionPolicyKeys.all(orgId), 'list'] as const,
	list: (orgId: string) => permissionPolicyKeys.lists(orgId),
	details: (orgId: string) =>
		[...permissionPolicyKeys.all(orgId), 'detail'] as const,
	detail: (orgId: string, id: string) =>
		[...permissionPolicyKeys.details(orgId), id] as const,
}
