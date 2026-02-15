import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from '@abumble/design-system/components/Empty'
import { FileQuestionMark } from 'lucide-react'
import { cn } from '@abumble/design-system/utils'
import type { ReactNode } from 'react'

export interface CenteredEmptyStateProps {
	title: ReactNode
	description: ReactNode
	action: ReactNode
	icon?: ReactNode
	className?: string
}

export function CenteredEmptyState({
	title,
	description,
	action,
	icon,
	className,
}: CenteredEmptyStateProps) {
	return (
		<div className={cn('flex relative top-full flex-col', className)}>
			<Empty className="min-h-0 flex-1 w-full">
				<EmptyHeader>
					{icon ?? <FileQuestionMark size={128} className="mb-2" />}
					<EmptyTitle className="text-3xl">{title}</EmptyTitle>
					<EmptyDescription className="text-lg">{description}</EmptyDescription>
				</EmptyHeader>
				<EmptyContent>
					<EmptyDescription>{action}</EmptyDescription>
				</EmptyContent>
			</Empty>
		</div>
	)
}
