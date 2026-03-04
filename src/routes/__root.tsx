import Footer from '@/components/Footer'
import { config } from '@/config'
import { useTheme } from '@/contexts/theme'
import type { MyRouterContext } from '@/integrations/tanstack-query/router'
import { UnderConstruction } from '@abumble/design-system/components/UnderConstruction'
import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import { Toaster } from 'sonner'

export const Route = createRootRouteWithContext<MyRouterContext>()({
	component: Root,
})

function Root() {
	const { effectiveTheme } = useTheme()

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
		<div className="flex flex-col min-h-screen w-full">
			<Toaster theme={effectiveTheme} />
			<Outlet />
		</div>
	)
}
