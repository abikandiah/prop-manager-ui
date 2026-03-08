import {
	Card,
	CardContent,
	CardHeader,
} from '@abumble/design-system/components/Card'
import { Link } from '@tanstack/react-router'
import type { LucideIcon } from 'lucide-react'

interface DashboardCardProps {
	to: string
	icon: LucideIcon
	title: string
	description: string
}

export function DashboardCard({
	to,
	icon: Icon,
	title,
	description,
}: DashboardCardProps) {
	return (
		<Link to={to}>
			<Card className="card transition-colors hover:bg-muted/50 h-full">
				<CardHeader className="flex flex-row items-center gap-2">
					<Icon className="size-5 text-muted-foreground" />
					<span className="font-semibold">{title}</span>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-muted-foreground">{description}</p>
				</CardContent>
			</Card>
		</Link>
	)
}
