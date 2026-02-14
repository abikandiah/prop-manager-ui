'use client'

import * as React from 'react'
import { XIcon } from 'lucide-react'
import { Dialog as DialogPrimitive } from 'radix-ui'

import { cn } from '@abumble/design-system/utils'
import { Button } from '@abumble/design-system/components/Button'

/** Class for create/edit form dialogs: consistent width and scroll. Use via FormDialog or apply to DialogContent. */
export const FORM_DIALOG_CONTENT_CLASS =
	'max-w-[calc(100vw-2rem)] sm:max-w-2xl max-h-[90vh] overflow-y-auto'

function Dialog({
	...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
	return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
	...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
	return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
	...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
	return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
	...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
	return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
	className,
	...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
	return (
		<DialogPrimitive.Overlay
			data-slot="dialog-overlay"
			className={cn(
				'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50',
				className,
			)}
			{...props}
		/>
	)
}

function DialogContent({
	className,
	children,
	showCloseButton = true,
	...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
	showCloseButton?: boolean
}) {
	return (
		<DialogPortal data-slot="dialog-portal">
			<DialogOverlay />
			<DialogPrimitive.Content
				data-slot="dialog-content"
				className={cn(
					'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded border p-6 shadow-lg duration-200 outline-none sm:max-w-lg',
					className,
				)}
				{...props}
			>
				{children}
				{showCloseButton && (
					<DialogPrimitive.Close
						data-slot="dialog-close"
						className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
					>
						<XIcon />
						<span className="sr-only">Close</span>
					</DialogPrimitive.Close>
				)}
			</DialogPrimitive.Content>
		</DialogPortal>
	)
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot="dialog-header"
			className={cn('flex flex-col gap-2 text-center sm:text-left', className)}
			{...props}
		/>
	)
}

function DialogFooter({
	className,
	showCloseButton = false,
	children,
	...props
}: React.ComponentProps<'div'> & {
	showCloseButton?: boolean
}) {
	return (
		<div
			data-slot="dialog-footer"
			className={cn(
				'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
				className,
			)}
			{...props}
		>
			{children}
			{showCloseButton && (
				<DialogPrimitive.Close asChild>
					<Button variant="outline">Close</Button>
				</DialogPrimitive.Close>
			)}
		</div>
	)
}

function DialogTitle({
	className,
	...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
	return (
		<DialogPrimitive.Title
			data-slot="dialog-title"
			className={cn('text-lg leading-none font-semibold', className)}
			{...props}
		/>
	)
}

function DialogDescription({
	className,
	...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
	return (
		<DialogPrimitive.Description
			data-slot="dialog-description"
			className={cn('text-muted-foreground text-sm', className)}
			{...props}
		/>
	)
}

export interface FormDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	title: string
	description: React.ReactNode
	/** Optional trigger (e.g. "Add" button); when provided, render as first child of Dialog. */
	trigger?: React.ReactNode
	children: React.ReactNode
	/** Optional custom className for DialogContent (overrides FORM_DIALOG_CONTENT_CLASS). Use for wider dialogs (e.g., sm:max-w-5xl for wizards). */
	className?: string
	/** Optional wizard configuration for multi-step forms. Renders a stepper bar at the top of the header. */
	wizard?: {
		currentStep: number
		totalSteps: number
		stepTitle: string
		stepLabels?: string[]
	}
}

/** Compact glass-styled stepper for top-right corner of wizard dialogs. */
function WizardStepper({
	currentStep,
	totalSteps,
	stepLabels,
}: {
	currentStep: number
	totalSteps: number
	stepLabels?: string[]
}) {
	const steps = Array.from({ length: totalSteps }, (_, i) => i + 1)
	const currentLabel = stepLabels?.[currentStep - 1]

	return (
		<div
			className="absolute top-4 right-14 z-20 flex items-center gap-2 rounded-full border border-border/50 bg-background/80 px-3 py-1.5 backdrop-blur-sm"
			aria-label="Progress"
		>
			{/* Step dots */}
			<div className="flex items-center gap-1.5">
				{steps.map((step) => {
					const isCompleted = step < currentStep
					const isCurrent = step === currentStep

					return (
						<div
							key={step}
							className={cn(
								'h-1.5 w-1.5 rounded-full transition-all duration-300',
								isCurrent && 'bg-primary w-6',
								isCompleted && 'bg-primary',
								!isCurrent && !isCompleted && 'bg-muted',
							)}
							aria-current={isCurrent ? 'step' : undefined}
						/>
					)
				})}
			</div>

			{/* Step label/counter */}
			<div className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
				<span className="text-foreground">{currentStep}</span>
				<span>/</span>
				<span>{totalSteps}</span>
				{currentLabel && (
					<>
						<span className="text-border">·</span>
						<span className="hidden sm:inline">{currentLabel}</span>
					</>
				)}
			</div>
		</div>
	)
}

/** Dialog shell for create/edit forms: standard width, header with title + description. */
function FormDialog({
	open,
	onOpenChange,
	title,
	description,
	trigger,
	children,
	className,
	wizard,
}: FormDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			{trigger}
			<DialogContent className={className ?? FORM_DIALOG_CONTENT_CLASS}>
				{wizard && (
					<WizardStepper
						currentStep={wizard.currentStep}
						totalSteps={wizard.totalSteps}
						stepLabels={wizard.stepLabels}
					/>
				)}
				<div className="bg-muted -m-6 p-6 -mb-4">
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</div>
				{children}
			</DialogContent>
		</Dialog>
	)
}

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
}
