import { DialogFooter } from '@abumble/design-system/components/Dialog'
import { Button } from '@abumble/design-system/components/Button'
import { cn } from '@abumble/design-system/utils'
import type { ReactNode } from 'react'

interface FormFooterProps {
	/** Whether the form is currently submitting */
	pending: boolean
	onCancel?: () => void
	submitLabel: ReactNode
	pendingLabel?: string
	className?: string
}

/**
 * A standard footer for forms, typically used within a Dialog.
 * Abstracts the Cancel button, Submit button, and pending/loading states.
 */
export function FormFooter({
	pending,
	onCancel,
	submitLabel,
	pendingLabel = 'Saving…',
	className,
	...props
}: FormFooterProps) {
	return (
		<DialogFooter {...props} className={cn(className)}>
			{onCancel && (
				<Button variant="outline" type="button" onClick={onCancel}>
					Cancel
				</Button>
			)}
			<Button type="submit" disabled={pending}>
				{pending ? pendingLabel : submitLabel}
			</Button>
		</DialogFooter>
	)
}
