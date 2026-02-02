import {
	Card,
	CardContent,
	CardHeader,
} from '@abumble/design-system/components/Card'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Package, MessageSquare } from 'lucide-react'
import { PageHeader, PageDescription } from '@/components/ui'

export const Route = createFileRoute('/')({
	component: Home,
})

function Home() {
	return (
		<div className="space-y-8">
			<div>
				<PageHeader>Dashboard</PageHeader>
				<PageDescription className="mt-1">
					Welcome to Prop Manager. Manage your props and messages from here.
				</PageDescription>
			</div>
			<div className="grid gap-4 sm:grid-cols-2">
				<Link to="/props">
					<Card className="card transition-colors hover:bg-muted/50">
						<CardHeader className="flex flex-row items-center gap-2">
							<Package className="size-5 text-muted-foreground" />
							<span className="font-semibold">Props</span>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground">
								View and manage your props.
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
