import { getDevToken } from '@/api/client'
import { AppSidebar } from '@/components/AppSidebar'
import { DevAuthForm } from '@/components/DevAuthForm'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import { OnboardingForm } from '@/components/OnboardingForm'
import { RegisterForm } from '@/components/RegisterForm'
import { BannerBackgroundImage, LoadingScreen } from '@/components/ui'
import { config } from '@/config'
import { useAuth } from '@/contexts/auth'
import { useNetwork } from '@/contexts/network'
import { useOrganization } from '@/contexts/organization'
import { MessageBanner } from '@abumble/design-system/components/Banner'
import { DelayedLoadingFallback } from '@abumble/design-system/components/DelayedLoadingFallback'
import {
	SidebarInset,
	SidebarProvider,
} from '@abumble/design-system/components/Sidebar'
import { UnderConstruction } from '@abumble/design-system/components/UnderConstruction'
import { cn, stringToBoolean } from '@abumble/design-system/utils'
import { Outlet, createRootRoute, useLocation } from '@tanstack/react-router'
import { ServerOff, WifiOff } from 'lucide-react'
import type React from 'react'
import { useState } from 'react'

export const Route = createRootRoute({
	component: Root,
})

function Root() {
	const { user, refreshUser, isLoadingUser } = useAuth()
	const { organizations } = useOrganization()
	const location = useLocation()

	if (!config.constructionDisabled) {
		return (
			<div className="flex flex-col h-full">
				<div className="flex grow justify-center">
					<UnderConstruction />
				</div>
				<Footer />
			</div>
		)
	}

	let main = null
	if (isLoadingUser) {
		main = (
			<MainPage>
				<DelayedLoadingFallback
					isLoading={true || isLoadingUser}
					delayMs={config.loadingFallbackDelayMs}
					fallback={<LoadingScreen />}
				>
					{null}
				</DelayedLoadingFallback>
			</MainPage>
		)
	}

	// Public
	else if (location.pathname.startsWith('/public')) {
		main = (
			<MainPage>
				<Outlet />
			</MainPage>
		)
	}

	// If requires devAuth
	else if (config.isDevelopment && !getDevToken()) {
		const onDevAuthSuccess = () => {
			refreshUser()
		}
		main = (
			<BannerLandingPage>
				<DevAuthForm onSuccess={onDevAuthSuccess} />
			</BannerLandingPage>
		)
	}

	// Accept terms
	else if (!user?.termsAccepted) {
		main = (
			<BannerLandingPage>
				<RegisterForm />
			</BannerLandingPage>
		)
	}

	// Invite
	else if (location.pathname.startsWith('/invite')) {
		main = (
			<BannerLandingPage>
				<OfflineWarningBanner />
				<Outlet />
			</BannerLandingPage>
		)
	}

	// Onboarding
	else if (organizations.length === 0) {
		main = (
			<BannerLandingPage>
				<OnboardingForm />
			</BannerLandingPage>
		)
	}

	if (main != null) {
		return (
			<div className="flex min-h-screen w-full flex-col bg-background text-foreground">
				<Header />
				{main}
				<Footer />
			</div>
		)
	}

	return <DashboardHome />
}

function MainPage({ children }: { children: React.ReactNode }) {
	return (
		<main className="flex flex-col mt-14 p-6 min-h-[75vh]">
			<OfflineWarningBanner />
			{children}
		</main>
	)
}

const DISCLAIMER_DISMISSED_KEY = 'prop_mange_disclaimer_dismissed'

function BannerLandingPage({ children }: { children: React.ReactNode }) {
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

			<div className="flex-1 flex flex-col items-center justify-start pt-12 p-6">
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

function DashboardHome() {
	return (
		<SidebarProvider>
			<div className="layout-header-full flex min-h-screen w-full flex-col">
				<Header />
				<div className="flex flex-1 min-w-0 mt-14">
					<AppSidebar />
					<SidebarInset>
						<main className="flex flex-col p-6">
							<OfflineWarningBanner />
							<div className="flex flex-col gap-4">
								<Outlet />
							</div>
						</main>
						<Footer />
					</SidebarInset>
				</div>
			</div>
		</SidebarProvider>
	)
}

function OfflineWarningBanner() {
	const { isOnline, isServerReachable, consecutiveFailures } = useNetwork()
	if (isOnline) {
		return null
	}

	return (
		<MessageBanner
			type="warning"
			hideIcon
			message={
				<span className="flex flex-col gap-1">
					<span className="flex items-center gap-2">
						{isServerReachable ? (
							<>
								<WifiOff className="size-4 shrink-0" aria-hidden />
								<span>
									You're offline. Changes will sync when you're back online.
								</span>
							</>
						) : (
							<>
								<ServerOff className="size-4 shrink-0" aria-hidden />
								<span>
									Server unavailable. Changes will sync when the server is back
									online.
								</span>
							</>
						)}
					</span>
					{config.isDevelopment && consecutiveFailures > 0 && (
						<span className="text-xs opacity-75">
							Debug: {consecutiveFailures} consecutive failures
						</span>
					)}
				</span>
			}
			className={cn('mb-4 md:-mt-2')}
		/>
	)
}
