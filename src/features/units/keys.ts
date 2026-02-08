export const unitKeys = {
	all: ['units'] as const,
	lists: () => [...unitKeys.all, 'list'] as const,
	list: (propId: string | null) =>
		propId == null
			? (['units', 'list'] as const)
			: ([...unitKeys.all, 'list', propId] as const),
	details: () => [...unitKeys.all, 'detail'] as const,
	detail: (id: string) => [...unitKeys.details(), id] as const,
}
