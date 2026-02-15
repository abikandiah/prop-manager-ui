import { MessageBanner } from '@abumble/design-system/components/Banner'
import {
	SidebarInset,
	SidebarProvider,
} from '@abumble/design-system/components/Sidebar'
import { cn } from '@abumble/design-system/utils'
import { UnderConstruction } from '@abumble/design-system/components/UnderConstruction'
import { Outlet, createRootRoute, useLocation } from '@tanstack/react-router'
import { WifiOff, ServerOff } from 'lucide-react'
import { AppSidebar } from '@/components/AppSidebar'
import Footer from '@/components/Footer'
import { config } from '@/config'
import Header from '@/components/Header'
import { useNetwork } from '@/contexts/network'
import { useAuth } from '@/contexts/auth'
import { Register } from '@/components/Register'
import { DelayedLoadingFallback, LoadingScreen } from '@/components/ui'

export const Route = createRootRoute({
	component: Root,
})

function Root() {
	const { isOnline } = useNetwork()
	const { isLoadingUser, isUserDefined } = useAuth()
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

	const isPublicOrDev = isPublic || location.pathname.startsWith('/dev')
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
	} else if (!isUserDefined) {
		altContent = <Register />
	}

	if (isPublicOrDev || isLoadingUser || !isUserDefined) {
		return (
			<div className="layout-header-full flex min-h-screen w-full flex-col">
				<Header />
				<main className="flex flex-col mt-14 p-4 md:p-6 flex-1">
					{!isOnline && <OfflineWarningBanner />}
					{altContent}
				</main>
				<Footer />
			</div>
		)
	}

	return (
		<SidebarProvider>
			<div className="layout-header-full flex min-h-screen w-full flex-col">
				<Header />
				<div className="flex flex-1 min-w-0 mt-14">
					<AppSidebar />
					<SidebarInset>
						<main className="flex flex-col p-4 md:p-6">
							{!isOnline && <OfflineWarningBanner />}
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
	const { isServerReachable, consecutiveFailures } = useNetwork()

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
