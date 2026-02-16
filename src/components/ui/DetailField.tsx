import type { ReactNode } from 'react'

export const DETAIL_LABEL_CLASS =
	'text-xs font-semibold uppercase tracking-wider text-muted-foreground'

export function DetailField({
	label,
	children,
	valueClassName = 'text-foreground',
}: {
	label: string
	children: ReactNode
	valueClassName?: string
}) {
	return (
		<div>
			<label className={DETAIL_LABEL_CLASS}>{label}</label>
			<p className={['mt-1', valueClassName].filter(Boolean).join(' ')}>
				{children}
			</p>
		</div>
	)
}
