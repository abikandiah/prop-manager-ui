import { AppSidebar } from '@/components/AppSidebar'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import { Register } from '@/components/Register'
import { LoadingScreen } from '@/components/ui'
import { config } from '@/config'
import { useAuth } from '@/contexts/auth'
import { useNetwork } from '@/contexts/network'
import { MessageBanner } from '@abumble/design-system/components/Banner'
import { DelayedLoadingFallback } from '@abumble/design-system/components/DelayedLoadingFallback'
import {
	SidebarInset,
	SidebarProvider,
} from '@abumble/design-system/components/Sidebar'
import { UnderConstruction } from '@abumble/design-system/components/UnderConstruction'
import { cn } from '@abumble/design-system/utils'
import { Outlet, createRootRoute, useLocation } from '@tanstack/react-router'
import { ServerOff, WifiOff } from 'lucide-react'

export const Route = createRootRoute({
	component: Root,
})

function Root() {
	const { user, isLoadingUser, isUserDefined } = useAuth()
	const location = useLocation()
	const isPublic = location.pathname.startsWith('/public')

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

	const isPublicOrDev =
		isPublic ||
		location.pathname.startsWith('/dev') ||
		location.pathname.startsWith('/invite')
	const needsTermsAcceptance = isUserDefined && user && !user.termsAccepted
	let altContent = null
	if (isPublicOrDev) {
		altContent = <Outlet />
	} else if (isLoadingUser) {
		altContent = (
			<DelayedLoadingFallback
				isLoading={isLoadingUser}
				delayMs={config.loadingFallbackDelayMs}
				fallback={<LoadingScreen />}
			>
				{null}
			</DelayedLoadingFallback>
		)
	} else if (!isUserDefined || needsTermsAcceptance) {
		altContent = <Register />
	}

	if (
		isPublicOrDev ||
		isLoadingUser ||
		!isUserDefined ||
		needsTermsAcceptance
	) {
		return (
			<div className="layout-header-full flex min-h-screen w-full flex-col">
				<Header />
				<main className="flex flex-col mt-14 p-6 flex-1">
					<OfflineWarningBanner />
					{altContent}
				</main>
				<Footer />
			</div>
		)
	}

	return <DashboardHome />
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
