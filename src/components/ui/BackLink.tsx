import { Link } from '@tanstack/react-router'
import { BackLink as DesignSystemBackLink } from '@abumble/design-system/components/BackLink'

export interface BackLinkProps {
	/** Target path. Defaults to ".." (parent route). */
	to?: string
	/** Link text, e.g. "Back to properties". */
	label: string
	/** When true (default), replace current history entry instead of pushing. */
	replace?: boolean
	className?: string
}

/**
 * Back link with chevron. Wraps design-system BackLink with TanStack Router Link.
 */
export function BackLink({
	to = '..',
	label,
	replace = true,
	className,
}: BackLinkProps) {
	return (
		<DesignSystemBackLink asChild label={label}>
			<Link to={to} replace={replace} className={className} />
		</DesignSystemBackLink>
	)
}
