import {
	SidebarInset,
	SidebarProvider,
} from '@abumble/design-system/components/Sidebar'
import React from 'react'
import {
	BannerBackgroundImage,
	LoadingScreen,
	OfflineWarningBanner,
} from '../ui'

export function BannerLandingPage({ children }: { children: React.ReactNode }) {
	return (
		<main className="flex flex-1 flex-col">
			<BannerBackgroundImage>
				<div className="app-center-background-image" />
			</BannerBackgroundImage>

			<div className="flex-1 p-6">
				<OfflineWarningBanner />
				{children}
			</div>
		</main>
	)
}

export function DashboardPage({
	children,
	Sidebar,
}: {
	children: React.ReactNode
	Sidebar: React.ComponentType
}) {
	return (
		<SidebarProvider>
			<div className="flex flex-1 min-w-0 mt-14">
				<Sidebar />
				<SidebarInset>
					<main className="flex flex-col p-6">
						<OfflineWarningBanner />
						<div className="flex flex-col gap-4">{children}</div>
					</main>
				</SidebarInset>
			</div>
		</SidebarProvider>
	)
}

export function LoadingPage() {
	return (
		<main className="flex flex-col p-6 min-h-[75vh]">
			<LoadingScreen />
		</main>
	)
}
