export const leaseTemplateKeys = {
	all: (orgId: string) => ['org', orgId, 'lease-templates'] as const,
	lists: (orgId: string) => [...leaseTemplateKeys.all(orgId), 'list'] as const,
	list: (
		orgId: string,
		filters?: { active?: boolean; search?: string | null },
	) => {
		if (!filters || (!filters.active && !filters.search)) {
			return [...leaseTemplateKeys.all(orgId), 'list'] as const
		}
		const parts: Array<string | boolean | null | undefined> = [
			'org',
			orgId,
			'lease-templates',
			'list',
		]
		if (filters.active !== undefined) parts.push(filters.active)
		if (filters.search) parts.push(filters.search)
		return parts as ReadonlyArray<string | boolean | null | undefined>
	},
	details: (orgId: string) =>
		[...leaseTemplateKeys.all(orgId), 'detail'] as const,
	detail: (orgId: string, id: string) =>
		[...leaseTemplateKeys.details(orgId), id] as const,
}
