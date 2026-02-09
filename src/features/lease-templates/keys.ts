export const leaseTemplateKeys = {
	all: ['lease-templates'] as const,
	lists: () => [...leaseTemplateKeys.all, 'list'] as const,
	list: (filters?: { active?: boolean; search?: string | null }) => {
		if (!filters || (!filters.active && !filters.search)) {
			return ['lease-templates', 'list'] as const
		}
		const parts: Array<string | boolean | null | undefined> = [
			'lease-templates',
			'list',
		]
		if (filters.active !== undefined) parts.push(filters.active)
		if (filters.search) parts.push(filters.search)
		return parts as ReadonlyArray<string | boolean | null | undefined>
	},
	details: () => [...leaseTemplateKeys.all, 'detail'] as const,
	detail: (id: string) => [...leaseTemplateKeys.details(), id] as const,
}
