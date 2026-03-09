import type {
	NotificationPreference,
	UpdateNotificationPreferencePayload,
} from '@/domain/notification-preference'
import { IDEMPOTENCY_HEADER } from '@/lib/constants'
import { stableRequestId } from '@/lib/offline-types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notificationPreferencesApi } from './api'
import { notificationPreferenceKeys } from './keys'

/** Returns all notification preferences for the current user, including server-synthesized defaults. */
export function useNotificationPreferences() {
	return useQuery({
		queryKey: notificationPreferenceKeys.list(),
		queryFn: notificationPreferencesApi.list,
	})
}

/** Optimistically toggles a single notification preference. */
export function useUpdateNotificationPreference() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationKey: ['updateNotificationPreference'],
		networkMode: 'online',
		mutationFn: (payload: UpdateNotificationPreferencePayload) => {
			const requestId = stableRequestId(
				['updateNotificationPreference'],
				payload,
			)
			return notificationPreferencesApi.update(payload, {
				[IDEMPOTENCY_HEADER]: requestId,
			})
		},
		onMutate: async (payload) => {
			await queryClient.cancelQueries({
				queryKey: notificationPreferenceKeys.list(),
			})
			const previous = queryClient.getQueryData<NotificationPreference[]>(
				notificationPreferenceKeys.list(),
			)
			queryClient.setQueryData<NotificationPreference[]>(
				notificationPreferenceKeys.list(),
				(old) =>
					old?.map((pref) =>
						pref.notificationType === payload.notificationType &&
						pref.channel === payload.channel
							? { ...pref, enabled: payload.enabled }
							: pref,
					) ?? [],
			)
			return { previous }
		},
		onError: (_err, _payload, context) => {
			if (context?.previous) {
				queryClient.setQueryData(
					notificationPreferenceKeys.list(),
					context.previous,
				)
			}
		},
		onSettled: () => {
			queryClient.invalidateQueries({
				queryKey: notificationPreferenceKeys.list(),
			})
		},
	})
}
