import {
	Card,
	CardContent,
	CardHeader,
} from '@abumble/design-system/components/Card'
import { Link, Outlet, createFileRoute } from '@tanstack/react-router'
import { Lock } from 'lucide-react'
import { config } from '@/config'

export const Route = createFileRoute('/dev')({
	component: DevLayout,
})

function DevLayout() {
	if (!config.isDevelopment) {
		return (
			<div className="flex flex-col items-center justify-center flex-1 min-h-[60vh] px-4 py-12">
				<Card className="w-full max-w-md border-muted/50">
					<CardHeader className="space-y-1.5 pb-4">
						<div className="flex items-center gap-2 text-destructive">
							<Lock className="size-5 shrink-0" aria-hidden />
							<h1 className="text-xl font-semibold tracking-tight text-foreground">
								Development only
							</h1>
						</div>
						<p className="text-sm text-muted-foreground">
							This area is not available in production. Use the development
							server to access dev tools and auth.
						</p>
					</CardHeader>
					<CardContent>
						<Link
							to="/"
							className="text-sm font-medium text-primary hover:underline"
						>
							← Back to home
						</Link>
					</CardContent>
				</Card>
			</div>
		)
	}

	return <Outlet />
}
