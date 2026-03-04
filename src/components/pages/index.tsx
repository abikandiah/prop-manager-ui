import { MessageBanner } from '@abumble/design-system/components/Banner'
import {
	SidebarInset,
	SidebarProvider,
} from '@abumble/design-system/components/Sidebar'
import { stringToBoolean } from '@abumble/design-system/utils'
import React, { useState } from 'react'
import Footer from '../Footer'
import Header from '../Header'
import {
	BannerBackgroundImage,
	LoadingScreen,
	OfflineWarningBanner,
} from '../ui'

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
		<>
			<Header />
			<main className="flex flex-1 flex-col">
				<BannerBackgroundImage>
					<div className="app-center-background-image" />
				</BannerBackgroundImage>

				<div className="flex-1 flex flex-col items-center justify-start p-6">
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
			<Footer />
		</>
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
			<div className="flex flex-col min-h-screen w-full">
				<Header />
				<div className="flex flex-1 min-w-0">
					<Sidebar />
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
		<>
			<Header />
			<main className="flex flex-col p-6 min-h-[75vh]">
				<LoadingScreen />
			</main>
			<Footer />
		</>
	)
}
