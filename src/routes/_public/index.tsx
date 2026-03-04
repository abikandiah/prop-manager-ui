import { authQueryOptions } from '@/features/auth'
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_public/')({
	beforeLoad: async ({ context }) => {
		// Attempt to get user, fallback to null on 401/error
		const user = await context.globalClient
			.fetchQuery(authQueryOptions)
			.catch(() => null)

		if (user) {
			throw redirect({ to: '/home' })
		}
	},
	component: Home,
})

// Future landing page for '/' exact route!
function Home() {
	return <div className="flex flex-col gap-8"></div>
}
