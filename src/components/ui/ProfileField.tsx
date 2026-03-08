import { cn } from '@abumble/design-system/utils'

export interface ProfileFieldProps {
	label: string
	value: string | number | null | undefined
	className?: string
}

export function ProfileField({ label, value, className }: ProfileFieldProps) {
	return (
		<div className={cn('flex flex-col gap-0.5', className)}>
			<span className="text-xs text-muted-foreground">{label}</span>
			<span className="text-sm text-foreground">
				{value !== null && value !== undefined && value !== '' ? value : '—'}
			</span>
		</div>
	)
}
