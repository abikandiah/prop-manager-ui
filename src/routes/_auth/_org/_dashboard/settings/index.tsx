import { NotificationPreferencesSection } from '@/features/notification-preferences'
import { BannerHeader } from '@abumble/design-system/components/BannerHeader'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/_org/_dashboard/settings/')({
	component: SettingsPage,
})

function SettingsPage() {
	return (
		<div className="flex flex-col gap-6">
			<BannerHeader
				title="Settings"
				description="Manage your notification preferences."
			/>
			<NotificationPreferencesSection />
		</div>
	)
}
