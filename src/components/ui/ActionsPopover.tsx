import { useState } from 'react'
import { MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@abumble/design-system/components/Button'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@abumble/design-system/components/Popover'

export interface ActionsPopoverProps {
	label?: string
	onEdit: () => void
	onDelete: () => void
	isDeleteDisabled?: boolean
	/** Pass true to add stopPropagation on the trigger (e.g. inside table rows). */
	stopTriggerPropagation?: boolean
}

export function ActionsPopover({
	label = 'Actions',
	onEdit,
	onDelete,
	isDeleteDisabled = false,
	stopTriggerPropagation = false,
}: ActionsPopoverProps) {
	const [open, setOpen] = useState(false)

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					type="button"
					variant="ghost"
					size="icon"
					className="size-8 shrink-0"
					aria-label={label}
					onClick={
						stopTriggerPropagation ? (e) => e.stopPropagation() : undefined
					}
				>
					<MoreVertical className="size-4" />
				</Button>
			</PopoverTrigger>
			<PopoverContent align="end" className="w-40 p-0 mt-1">
				<ul className="flex flex-col gap-0.5 p-1.5">
					<li>
						<Button
							variant="ghost"
							size="sm"
							className="w-full justify-start gap-2"
							onClick={() => {
								setOpen(false)
								onEdit()
							}}
						>
							<Pencil className="size-4 shrink-0" />
							Edit
						</Button>
					</li>
					<li>
						<Button
							variant="ghost"
							size="sm"
							className="w-full justify-start gap-2 text-destructive hover:text-destructive"
							onClick={() => {
								setOpen(false)
								onDelete()
							}}
							disabled={isDeleteDisabled}
						>
							<Trash2 className="size-4 shrink-0" />
							Delete
						</Button>
					</li>
				</ul>
			</PopoverContent>
		</Popover>
	)
}
