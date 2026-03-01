import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@abumble/design-system/components/Card'
import { cn } from '@abumble/design-system/utils'

interface FormCardProps {
	title: React.ReactNode
	description?: React.ReactNode
	children?: React.ReactNode
	className?: string
	/** Optional footer content (e.g. links below the form) */
	footer?: React.ReactNode
}

export function FormCard({
	title,
	description,
	children,
	className,
	footer,
}: FormCardProps) {
	return (
		<Card className={cn('w-full max-w-md', className)}>
			<CardHeader>
				<CardTitle className="text-2xl">{title}</CardTitle>
				{description && <CardDescription>{description}</CardDescription>}
			</CardHeader>
			{(children || footer) && (
				<CardContent className="space-y-6">
					{children}
					{footer}
				</CardContent>
			)}
		</Card>
	)
}

export function FormActions({
	children,
	className,
	fullWidth,
}: {
	children: React.ReactNode
	className?: string
	fullWidth?: boolean
}) {
	return (
		<div
			className={cn(
				'flex gap-3 pt-2',
				fullWidth ? 'flex-col items-stretch' : 'items-center justify-end',
				className,
			)}
		>
			{children}
		</div>
	)
}
