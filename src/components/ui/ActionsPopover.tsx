import { Pencil, Trash2 } from 'lucide-react'
import { ActionsPopover as DesignSystemActionsPopover } from '@abumble/design-system/components/ActionsPopover'
import { useMemo } from 'react'

export interface ActionsPopoverProps {
	label?: string
	/** Omit or pass undefined to hide the Edit action. */
	onEdit?: () => void
	onDelete: () => void
	isDeleteDisabled?: boolean
	/** Pass true to add stopPropagation on the trigger (e.g. inside table rows). */
	stopTriggerPropagation?: boolean
}

/**
 * Edit + Delete row actions. Wraps design-system ActionsPopover with a fixed Edit/Delete API.
 */
export function ActionsPopover({
	label = 'Actions',
	onEdit,
	onDelete,
	isDeleteDisabled = false,
	stopTriggerPropagation = false,
}: ActionsPopoverProps) {
	const items = useMemo(
		() => [
			...(onEdit != null
				? [
						{
							label: 'Edit' as const,
							icon: <Pencil className="size-4 shrink-0" />,
							onClick: onEdit,
						},
					]
				: []),
			{
				label: 'Delete' as const,
				icon: <Trash2 className="size-4 shrink-0" />,
				onClick: onDelete,
				variant: 'destructive' as const,
				disabled: isDeleteDisabled,
			},
		],
		[onEdit, onDelete, isDeleteDisabled],
	)

	return (
		<DesignSystemActionsPopover
			label={label}
			items={items}
			stopTriggerPropagation={stopTriggerPropagation}
		/>
	)
}
