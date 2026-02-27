export const permissionTemplateKeys = {
	all: (orgId: string) => ['org', orgId, 'permission-templates'] as const,
	lists: (orgId: string) =>
		[...permissionTemplateKeys.all(orgId), 'list'] as const,
	list: (orgId: string) => permissionTemplateKeys.lists(orgId),
	details: (orgId: string) =>
		[...permissionTemplateKeys.all(orgId), 'detail'] as const,
	detail: (orgId: string, id: string) =>
		[...permissionTemplateKeys.details(orgId), id] as const,
}
