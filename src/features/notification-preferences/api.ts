import { api } from '@/api/client'
import type {
	NotificationPreference,
	UpdateNotificationPreferencePayload,
} from '@/domain/notification-preference'

class NotificationPreferencesApi {
	async list(): Promise<NotificationPreference[]> {
		const { data } =
			await api.get<NotificationPreference[]>('/notification-preferences')
		return data
	}

	async update(
		payload: UpdateNotificationPreferencePayload,
		headers?: Record<string, string>,
	): Promise<NotificationPreference> {
		const { data } = await api.patch<NotificationPreference>(
			'/notification-preferences',
			payload,
			{ headers },
		)
		return data
	}
}

export const notificationPreferencesApi = new NotificationPreferencesApi()
