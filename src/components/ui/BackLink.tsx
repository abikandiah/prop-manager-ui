import { cn } from '@abumble/design-system/utils'
import { Link } from '@tanstack/react-router'
import { ChevronLeft } from 'lucide-react'

export interface BackLinkProps {
	/** Target path. Defaults to ".." (parent route). */
	to?: string
	/** Link text, e.g. "Back to properties". */
	label: string
	/** When true (default), replace current history entry instead of pushing. Keeps browser back consistent. */
	replace?: boolean
	className?: string
}

export function BackLink({
	to = '..',
	label,
	replace = true,
	className,
}: BackLinkProps) {
	return (
		<Link
			to={to}
			replace={replace}
			className={cn(
				'inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground',
				className,
			)}
		>
			<ChevronLeft className="size-4 shrink-0" aria-hidden />
			<span>{label}</span>
		</Link>
	)
}
