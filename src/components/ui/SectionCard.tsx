import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@abumble/design-system/components/Card'
import type { ReactNode } from 'react'

interface SectionCardProps {
	title?: ReactNode
	description?: ReactNode
	children: ReactNode
	className?: string
	contentClassName?: string
	/** Optional actions to show in the header (e.g., Edit button). */
	actions?: ReactNode
}

/**
 * A standard layout card for sections, detail views, and grouped information.
 * Uses @abumble/design-system/components/Card but enforces consistent padding
 * and header styling used throughout the app.
 */
export function SectionCard({
	title,
	description,
	children,
	className,
	contentClassName,
	actions,
}: SectionCardProps) {
	const hasHeader = !!title || !!description || !!actions

	return (
		<Card className={className}>
			{hasHeader && (
				<CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 border-b">
					<div className="space-y-1">
						{title && (
							<CardTitle className="text-base font-semibold leading-none">
								{title}
							</CardTitle>
						)}
						{description && (
							<CardDescription className="text-sm">
								{description}
							</CardDescription>
						)}
					</div>
					{actions && <div>{actions}</div>}
				</CardHeader>
			)}
			<CardContent className={contentClassName}>{children}</CardContent>
		</Card>
	)
}
