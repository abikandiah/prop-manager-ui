import { Button } from '@abumble/design-system/components/Button'
import { DialogFooter } from '@abumble/design-system/components/Dialog'
import { cn } from '@abumble/design-system/utils'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import type { ReactNode } from 'react'

interface WizardFooterProps {
	/** Whether the form is currently submitting */
	pending: boolean
	onCancel?: () => void
	onBack?: () => void
	onNext?: () => void
	showSubmit?: boolean
	submitLabel: ReactNode
	pendingLabel?: string
	className?: string
}

/**
 * A standard footer for multi-step wizard forms, typically used within a Dialog.
 * Abstracts Cancel, Back, Next, and Submit buttons with consistent icons and pending states.
 */
export function WizardFooter({
	pending,
	onCancel,
	onBack,
	onNext,
	showSubmit,
	submitLabel,
	pendingLabel = 'Saving…',
	className,
	...props
}: WizardFooterProps) {
	return (
		<DialogFooter {...props} className={cn('gap-2', className)}>
			{onCancel && (
				<Button
					type="button"
					variant="outline"
					onClick={onCancel}
					disabled={pending}
				>
					Cancel
				</Button>
			)}

			<div className="flex gap-2">
				{onBack && (
					<Button
						type="button"
						variant="outline"
						onClick={onBack}
						disabled={pending}
					>
						<ArrowLeft className="h-4 w-4" />
						Back
					</Button>
				)}

				{onNext && (
					<Button type="button" onClick={onNext} disabled={pending}>
						Next
						<ArrowRight className="h-4 w-4" />
					</Button>
				)}

				{showSubmit && (
					<Button type="submit" disabled={pending}>
						{pending ? (
							pendingLabel
						) : (
							<>
								<Check className="h-4 w-4" />
								{submitLabel}
							</>
						)}
					</Button>
				)}
			</div>
		</DialogFooter>
	)
}
