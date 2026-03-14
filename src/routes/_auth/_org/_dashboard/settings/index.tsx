import { SectionCard } from '@/components/ui/SectionCard'
import { NotificationPreferencesSection } from '@/features/notification-preferences'
import { BannerHeader } from '@abumble/design-system/components/BannerHeader'
import { ThemeSelector } from '@abumble/design-system/components/ThemeSelector'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/_org/_dashboard/settings/')({
	component: SettingsPage,
})

function AppearanceSection() {
	return (
		<SectionCard
			title="Appearance"
			description="Customize how the app looks."
		>
			<div className="flex items-center justify-between py-3">
				<div className="space-y-0.5">
					<p className="text-sm font-medium leading-none">Color theme</p>
					<p className="text-sm text-muted-foreground">
						Pick an accent color for the interface.
					</p>
				</div>
				<ThemeSelector />
			</div>
		</SectionCard>
	)
}

function SettingsPage() {
	return (
		<div className="flex flex-col gap-6">
			<BannerHeader
				title="Settings"
				description="Manage your preferences."
			/>
			<AppearanceSection />
			<NotificationPreferencesSection />
		</div>
	)
}
