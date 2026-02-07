import {
	Card,
	CardContent,
	CardHeader,
} from '@abumble/design-system/components/Card'
import { Link, createFileRoute } from '@tanstack/react-router'
import { Hammer } from 'lucide-react'
import { PageDescription, PageHeader } from '@/components/ui'

export const Route = createFileRoute('/dev/')({
	component: DevIndex,
})

const devRoutes = [
	{
		to: '/dev/auth',
		title: 'Dev auth',
		description:
			'Authenticate with the backend using /api/dev/login. Use this to sign in when developing against a local API.',
	},
] as const

function DevIndex() {
	return (
		<div className="flex flex-col items-center flex-1 gap-8 px-4 py-12 min-h-[60vh]">
			<div className="text-center space-y-2">
				<PageHeader className="flex items-center justify-center gap-2">
					<Hammer className="size-8 text-muted-foreground" aria-hidden />
					Dev
				</PageHeader>
				<PageDescription className="max-w-md mx-auto">
					Development-only tools and routes.
				</PageDescription>
			</div>

			<div className="grid w-full max-w-2xl gap-4">
				{devRoutes.map(({ to, title, description }) => (
					<Link key={to} to={to} className="block text-left">
						<Card>
							<CardHeader>
								<h2 className="text-lg font-semibold">{title}</h2>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-muted-foreground">{description}</p>
							</CardContent>
						</Card>
					</Link>
				))}
			</div>
		</div>
	)
}
