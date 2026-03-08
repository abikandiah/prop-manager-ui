import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@abumble/design-system/components/Card'
import { cn } from '@abumble/design-system/utils'
import type { ReactNode } from 'react'

interface SectionCardProps {
	/** Title displayed in the card header. */
	title?: ReactNode
	/** Optional description below the title. */
	description?: ReactNode
	/** Content of the card. Wraps in CardContent with standard padding. */
	children: ReactNode
	/** Optional className for the root Card element. */
	className?: string
	/** Optional className for the CardContent element. */
	contentClassName?: string
	/** Optional actions to show in the header (e.g., Edit button). */
	actions?: ReactNode
	/** If true, removes the default px-5 py-4 padding from CardContent. */
	noPadding?: boolean
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
	noPadding = false,
}: SectionCardProps) {
	const hasHeader = !!title || !!description || !!actions

	return (
		<Card className={className}>
			{hasHeader && (
				<CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 px-5 py-4 border-b">
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
			<CardContent
				className={cn(
					!noPadding && 'px-5 py-4',
					noPadding && 'p-0',
					contentClassName,
				)}
			>
				{children}
			</CardContent>
		</Card>
	)
}
