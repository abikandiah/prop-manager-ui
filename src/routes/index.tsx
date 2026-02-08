import {
	Card,
	CardContent,
	CardHeader,
} from '@abumble/design-system/components/Card'
import { Link, createFileRoute } from '@tanstack/react-router'
import { MessageSquare, Package } from 'lucide-react'
import { BannerHeader } from '@/components/ui'

export const Route = createFileRoute('/')({
	component: Home,
})

function Home() {
	return (
		<div className="flex flex-col gap-8">
			<BannerHeader
				title="Dashboard"
				description="Your home base. From here you can jump to your list of properties or your messages—everything in one place."
			/>

			<div className="grid gap-4 sm:grid-cols-2">
				<Link to="/props">
					<Card className="card transition-colors hover:bg-muted/50">
						<CardHeader className="flex flex-row items-center gap-2">
							<Package className="size-5 text-muted-foreground" />
							<span className="font-semibold">Properties</span>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground">
								See and manage every property you own or look after.
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
								Read and manage your messages in one place.
							</p>
						</CardContent>
					</Card>
				</Link>
			</div>
		</div>
	)
}
