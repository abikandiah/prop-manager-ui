export const propKeys = {
	all: ['props'] as const,
	lists: () => [...propKeys.all, 'list'] as const,
	list: () => propKeys.lists(),
	details: () => [...propKeys.all, 'detail'] as const,
	detail: (id: string) => [...propKeys.details(), id] as const,
}
