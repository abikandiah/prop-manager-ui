import { MessageBanner } from '@abumble/design-system/components/Banner'
import {
	SidebarInset,
	SidebarProvider,
} from '@abumble/design-system/components/Sidebar'
import { cn } from '@abumble/design-system/utils'
import { UnderConstruction } from '@abumble/design-system/components/UnderConstruction'
import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { WifiOff } from 'lucide-react'
import { AppSidebar } from '@/components/AppSidebar'
import Footer from '@/components/Footer'
import { config } from '@/config'
import Header from '@/components/Header'
import { useNetwork } from '@/contexts/network'

interface MyRouterContext {
	queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	component: Root,
})

function Root() {
	const { isOnline } = useNetwork()

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

	return (
		<SidebarProvider>
			<div className="layout-header-full flex min-h-screen w-full flex-col">
				<Header />
				<div className="flex flex-1 min-w-0 mt-14">
					<AppSidebar />
					<SidebarInset>
						<main className="flex flex-col p-4 md:p-6">
							{!isOnline && (
								<MessageBanner
									type="warning"
									hideIcon
									message={
										<span className="flex items-center gap-2">
											<WifiOff className="size-4 shrink-0" aria-hidden />
											<span>
												You're offline. Changes will sync when you're back
												online.
											</span>
										</span>
									}
									className={cn(
										'mb-4 md:-mt-2 border-amber-500/40 bg-amber-500/10 text-amber-800',
										'dark:border-amber-400/40 dark:bg-amber-500/15 dark:text-amber-200',
									)}
								/>
							)}
							<Outlet />
						</main>
						<Footer />
					</SidebarInset>
				</div>
			</div>
		</SidebarProvider>
	)
}
