export const permissionTemplateKeys = {
	all: ['permission-templates'] as const,
	lists: () => [...permissionTemplateKeys.all, 'list'] as const,
	listByOrg: (orgId: string) =>
		[...permissionTemplateKeys.lists(), { orgId }] as const,
	details: () => [...permissionTemplateKeys.all, 'detail'] as const,
	detail: (id: string) => [...permissionTemplateKeys.details(), id] as const,
}
