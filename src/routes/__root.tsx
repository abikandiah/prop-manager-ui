import { UnderConstruction } from '@abumble/design-system/components/UnderConstruction';
import { Outlet, createRootRouteWithContext } from '@tanstack/react-router';
import type { QueryClient } from '@tanstack/react-query';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { config } from '@/config';


interface MyRouterContext {
	queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	component: Root
});

function Root() {

	if (!config.constructionDisabled) {
		return (
			<div className="flex flex-col h-full">
				<div className='flex flex-grow justify-center'>
					<UnderConstruction />
				</div>

				<Footer showLinks={false} />
			</div>
		)
	}

	return (
		<div className="flex flex-col h-full">
			<Header />

			<main className="w-full mt-10 px-3">
				<Outlet />
			</main>

			<Footer />
		</div>
	)
}

