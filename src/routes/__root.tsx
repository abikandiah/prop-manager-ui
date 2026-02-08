import { MessageBanner } from '@abumble/design-system/components/Banner'
import {
	SidebarInset,
	SidebarProvider,
} from '@abumble/design-system/components/Sidebar'
import { cn } from '@abumble/design-system/utils'
import { UnderConstruction } from '@abumble/design-system/components/UnderConstruction'
import {
	Outlet,
	createRootRouteWithContext,
	useLocation,
} from '@tanstack/react-router'
import { WifiOff } from 'lucide-react'
import type { QueryClient } from '@tanstack/react-query'
import { AppSidebar } from '@/components/AppSidebar'
import Footer from '@/components/Footer'
import { config } from '@/config'
import Header from '@/components/Header'
import { useNetwork } from '@/contexts/network'
import { useAuth } from '@/contexts/auth'
import { Register } from '@/components/Register'
import { DelayedLoadingFallback, LoadingScreen } from '@/components/ui'

interface MyRouterContext {
	queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
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
			<DelayedLoadingFallback isLoading={isLoadingUser} fallback={<LoadingScreen />}>
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
							<div className="flex flex-col gap-6">
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
	return (
		<MessageBanner
			type="warning"
			hideIcon
			message={
				<span className="flex items-center gap-2">
					<WifiOff className="size-4 shrink-0" aria-hidden />
					<span>
						You're offline. Changes will sync when you're back online.
					</span>
				</span>
			}
			className={cn('mb-4 md:-mt-2')}
		/>
	)
}
