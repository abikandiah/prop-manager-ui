import { Button } from '@abumble/design-system/components/Button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from './dialog'
import type * as React from 'react'

export interface ConfirmDeleteDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	title: string
	description: React.ReactNode
	onConfirm: () => void
	isPending?: boolean
}

export function ConfirmDeleteDialog({
	open,
	onOpenChange,
	title,
	description,
	onConfirm,
	isPending = false,
}: ConfirmDeleteDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent showCloseButton={true}>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>
				<DialogFooter showCloseButton={false}>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button
						variant="destructive"
						onClick={onConfirm}
						disabled={isPending}
					>
						{isPending ? 'Deleting…' : 'Delete'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
