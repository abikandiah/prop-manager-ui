export const propKeys = {
	all: (orgId: string) => ['org', orgId, 'props'] as const,
	lists: (orgId: string) => [...propKeys.all(orgId), 'list'] as const,
	list: (orgId: string) => propKeys.lists(orgId),
	details: (orgId: string) => [...propKeys.all(orgId), 'detail'] as const,
	detail: (orgId: string, id: string) =>
		[...propKeys.details(orgId), id] as const,
	units: (orgId: string, propId: string) =>
		[...propKeys.detail(orgId, propId), 'units'] as const,
}
