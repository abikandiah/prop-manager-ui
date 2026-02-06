import {
	Card,
	CardContent,
	CardHeader,
} from '@abumble/design-system/components/Card'
import { Link, createFileRoute } from '@tanstack/react-router'
import { MessageSquare, Package } from 'lucide-react'
import { PageDescription, PageHeader } from '@/components/ui'

export const Route = createFileRoute('/')({
	component: Home,
})

function Home() {
	return (
		<div className="flex flex-col gap-8">
			{/* Header Banner */}
			<div className="relative -mx-4 -mt-4 overflow-hidden border-b bg-card md:-mx-6 md:-mt-6">
				<div className="image-background absolute inset-0 opacity-10" />
				<div className="relative px-4 py-8 md:px-6 md:py-12">
					<div className="space-y-1.5">
						<PageHeader>Dashboard</PageHeader>
						<PageDescription>
							Welcome to PropMange. Manage your properties and messages from one
							central dashboard.
						</PageDescription>
					</div>
				</div>
			</div>

			<div className="grid gap-4 sm:grid-cols-2">
				<Link to="/props">
					<Card className="card transition-colors hover:bg-muted/50">
						<CardHeader className="flex flex-row items-center gap-2">
							<Package className="size-5 text-muted-foreground" />
							<span className="font-semibold">Properties</span>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground">
								View and manage your properties.
							</p>
						</CardContent>
					</Card>
				</Link>
				<Link to="/messages">
					<Card className="card transition-colors hover:bg-muted/50">
						<CardHeader className="flex flex-row items-center gap-2">
							<MessageSquare className="size-5 text-muted-foreground" />
							<span className="font-semibold">Messages</span>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground">
								Browse and manage messages.
							</p>
						</CardContent>
					</Card>
				</Link>
			</div>
		</div>
	)
}
