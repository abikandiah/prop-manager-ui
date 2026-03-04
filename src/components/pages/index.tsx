import { config } from '@/config'
import { MessageBanner } from '@abumble/design-system/components/Banner'
import { DelayedLoadingFallback } from '@abumble/design-system/components/DelayedLoadingFallback'
import {
	SidebarInset,
	SidebarProvider,
} from '@abumble/design-system/components/Sidebar'
import { stringToBoolean } from '@abumble/design-system/utils'
import React, { useState } from 'react'
import { AppSidebar } from '../AppSidebar'
import Footer from '../Footer'
import Header from '../Header'
import {
	BannerBackgroundImage,
	LoadingScreen,
	OfflineWarningBanner,
} from '../ui'

export function MainPage({ children }: { children: React.ReactNode }) {
	return (
		<main className="flex flex-col mt-14 p-6 min-h-[75vh]">
			<OfflineWarningBanner />
			{children}
		</main>
	)
}

const DISCLAIMER_DISMISSED_KEY = 'prop_mange_disclaimer_dismissed'

export function BannerLandingPage({ children }: { children: React.ReactNode }) {
	const [dismissed, setDismissed] = useState(
		stringToBoolean(localStorage.getItem(DISCLAIMER_DISMISSED_KEY)),
	)

	function onDisclaimerDismiss() {
		localStorage.setItem(DISCLAIMER_DISMISSED_KEY, true.toString())
		setDismissed(true)
	}

	return (
		<main className="flex flex-1 flex-col">
			<BannerBackgroundImage>
				<div className="app-center-background-image" />
			</BannerBackgroundImage>

			<div className="flex-1 flex flex-col items-center justify-start mt-12 p-6">
				<div className="w-full max-w-md space-y-4">
					<OfflineWarningBanner />

					{!dismissed && (
						<MessageBanner
							type="info"
							message="This is a sandbox environment. It is not intended for business or commercial use. No warranty, uptime guarantees, 
									or technical support are provided."
							className="w-full max-w-md rounded"
							onClose={onDisclaimerDismiss}
							hideIcon
						/>
					)}

					{children}
				</div>
			</div>
		</main>
	)
}

export function DashboardPage({ children }: { children: React.ReactNode }) {
	return (
		<SidebarProvider>
			<div className="flex flex-col min-h-screen w-full">
				<Header />
				<div className="flex flex-1 min-w-0 mt-14">
					<AppSidebar />
					<SidebarInset>
						<main className="flex flex-col p-6">
							<OfflineWarningBanner />
							<div className="flex flex-col gap-4">{children}</div>
						</main>
						<Footer />
					</SidebarInset>
				</div>
			</div>
		</SidebarProvider>
	)
}

export function LoadingPage() {
	return (
		<MainPage>
			<DelayedLoadingFallback
				isLoading={true}
				delayMs={config.loadingFallbackDelayMs}
				fallback={<LoadingScreen />}
			>
				{null}
			</DelayedLoadingFallback>
		</MainPage>
	)
}
