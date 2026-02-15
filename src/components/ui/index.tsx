import { cn } from '@abumble/design-system/utils'
import * as React from 'react'
import { Link } from '@tanstack/react-router'
import type { LinkComponentProps } from '@tanstack/react-router'

export function Spinner({ className }: { className?: string }) {
	return (
		<div className={cn('relative flex items-center justify-center', className)}>
			{/* Slow outer ring */}
			<div className="absolute inset-0 animate-[spin_3s_linear_infinite] rounded-full border-[3px] border-primary/10 border-t-primary/30" />

			{/* Medium reverse inner ring */}
			<div className="absolute inset-2 animate-[spin_2s_linear_infinite_reverse] rounded-full border-[3px] border-primary/10 border-b-primary/20" />

			{/* Fast main orbital segment */}
			<svg
				className="absolute inset-0 h-full w-full animate-[spin_1.5s_cubic-bezier(0.4,0,0.2,1)_infinite]"
				viewBox="0 0 100 100"
			>
				<circle
					cx="50"
					cy="50"
					r="42"
					fill="none"
					stroke="currentColor"
					strokeWidth="6"
					strokeDasharray="60 200"
					strokeLinecap="round"
					className="text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]"
				/>
			</svg>

			{/* Subtle core pulse (no dot, just light) */}
			<div className="h-4 w-4 animate-pulse rounded-full bg-primary/5 blur-sm" />
		</div>
	)
}

export function LoadingScreen() {
	return (
		<div className="flex flex-col items-center justify-center flex-1">
			<div className="relative mb-8">
				<Spinner className="h-24 w-24" />
				{/* Background ambient glow */}
				<div className="absolute inset-0 -z-10 animate-pulse bg-primary/10 blur-[100px]" />
			</div>

			<div className="flex flex-col items-center text-center">
				<div className="space-y-1">
					<h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
						PropMange
					</h2>
				</div>

				<div className="mt-4 flex flex-col items-center gap-2">
					<p className="text-sm font-medium text-muted-foreground">
						Verifying session
					</p>
					<div className="flex gap-1">
						<span className="h-1 w-1 animate-[pulse_1.5s_ease-in-out_infinite] rounded-full bg-primary" />
						<span className="h-1 w-1 animate-[pulse_1.5s_ease-in-out_0.2s_infinite] rounded-full bg-primary" />
						<span className="h-1 w-1 animate-[pulse_1.5s_ease-in-out_0.4s_infinite] rounded-full bg-primary" />
					</div>
				</div>
			</div>
		</div>
	)
}

export function TextLink({ className, ...props }: LinkComponentProps) {
	return <Link {...props} className={cn('text-link', className)} />
}

interface ExternalSiteProps {
	url: string
	src: string
	alt: string
}

export function ExternalSite({
	url,
	src,
	alt,
	...rest
}: ExternalSiteProps & React.ComponentProps<'a'>) {
	return (
		<a href={url} target="_blank" rel="noopener noreferrer" {...rest}>
			<img src={src} alt={alt} className="h-6 w-6" />
		</a>
	)
}

export * from './ActionsPopover'
export {
	ConfirmDeleteDialog,
	type ConfirmDeleteDialogProps,
} from '@abumble/design-system/components/ConfirmDeleteDialog'
export {
	DelayedLoadingFallback,
	type DelayedLoadingFallbackProps,
} from '@abumble/design-system/components/DelayedLoadingFallback'
export { Badge } from '@abumble/design-system/components/Badge'
export {
	Table,
	TableHeader,
	TableBody,
	TableFooter,
	TableHead,
	TableRow,
	TableCell,
	TableCaption,
} from '@abumble/design-system/components/Table'
export { Checkbox } from '@abumble/design-system/components/Checkbox'
export { Label } from '@abumble/design-system/components/Label'
export { Select } from '@abumble/design-system/components/Select'
export { Textarea } from '@abumble/design-system/components/Textarea'
export {
	PageHeader,
	PageDescription,
} from '@abumble/design-system/components/PageHeader'
export {
	FieldsTable,
	type FieldRow,
	type FieldsTableProps,
} from '@abumble/design-system/components/FieldsTable'
export * from './BackLink'
export * from './BannerHeader'
export * from './Toaster'
export {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogOverlay,
	DialogPortal,
	DialogTitle,
	DialogTrigger,
	FormDialog,
	type FormDialogProps,
	FORM_DIALOG_CONTENT_CLASS,
	WizardStepper,
} from '@abumble/design-system/components/Dialog'
