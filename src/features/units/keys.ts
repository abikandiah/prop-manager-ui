export const unitKeys = {
	all: (orgId: string) => ['org', orgId, 'units'] as const,
	lists: (orgId: string) => [...unitKeys.all(orgId), 'list'] as const,
	list: (orgId: string, propId: string | null) =>
		propId == null
			? ([...unitKeys.all(orgId), 'list'] as const)
			: ([...unitKeys.all(orgId), 'list', propId] as const),
	details: (orgId: string) => [...unitKeys.all(orgId), 'detail'] as const,
	detail: (orgId: string, id: string) =>
		[...unitKeys.details(orgId), id] as const,
}
