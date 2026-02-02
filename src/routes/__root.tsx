import {
	SidebarInset,
	SidebarProvider,
} from '@abumble/design-system/components/Sidebar'
import { UnderConstruction } from '@abumble/design-system/components/UnderConstruction'
import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { AppSidebar } from '@/components/AppSidebar'
import Footer from '@/components/Footer'
import { config } from '@/config'
import Header from '@/components/Header'

interface MyRouterContext {
	queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	component: Root,
})

function Root() {
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
						<main className="flex flex-1 flex-col p-4 md:p-6">
							<Outlet />
						</main>
						<Footer />
					</SidebarInset>
				</div>
			</div>
		</SidebarProvider>
	)
}
