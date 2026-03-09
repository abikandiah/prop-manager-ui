import { Card, CardContent } from '@abumble/design-system/components/Card'
import { Skeleton } from '@abumble/design-system/components/Skeleton'
import { cn } from '@abumble/design-system/utils'
import type { LucideIcon } from 'lucide-react'

interface MetricCardProps {
	title: string
	value: string | number
	subtitle?: string
	icon: LucideIcon
	isLoading?: boolean
	className?: string
}

export function MetricCard({
	title,
	value,
	subtitle,
	icon: Icon,
	isLoading,
	className,
}: MetricCardProps) {
	return (
		<Card className={cn('metallic-panel', className)}>
			<CardContent className="flex flex-col gap-3">
				<div className="flex items-center justify-between">
					<span className="text-sm text-muted-foreground">{title}</span>
					<Icon className="h-4 w-4 text-muted-foreground" />
				</div>
				{isLoading ? (
					<div className="space-y-2">
						<Skeleton className="h-7 w-24" />
						{subtitle !== undefined && <Skeleton className="h-4 w-32" />}
					</div>
				) : (
					<div>
						<p className="text-2xl font-semibold">{value}</p>
						{subtitle && (
							<p className="text-xs text-muted-foreground">{subtitle}</p>
						)}
					</div>
				)}
			</CardContent>
		</Card>
	)
}
