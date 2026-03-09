export const notificationPreferenceKeys = {
	all: ['notification-preferences'] as const,
	list: () => [...notificationPreferenceKeys.all, 'list'] as const,
}
