import { useState } from 'react'
import type { ReactNode } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import {
	ActionsPopover,
	type ActionItem,
} from '@abumble/design-system/components/ActionsPopover'
import { ConfirmDeleteDialog } from '@abumble/design-system/components/ConfirmDeleteDialog'

export interface EntityActionsProps {
	/** Optional label for the actions button (defaults to "Actions") */
	label?: string
	/** Show edit action. If undefined/false, edit will be hidden. */
	onEdit?: (() => void) | false
	/** Callback when delete is confirmed */
	onDelete: () => void
	/** Whether delete operation is pending */
	isDeletePending?: boolean
	/** Additional action items to show before edit/delete */
	additionalItems?: ActionItem[]
	/** Stop propagation on trigger click (useful in table rows) */
	stopTriggerPropagation?: boolean
	/** Delete confirmation dialog title */
	deleteTitle: string
	/** Delete confirmation dialog description */
	deleteDescription: ReactNode
}

/**
 * Reusable entity actions popover with edit/delete and optional additional items.
 * Common pattern for entity row actions (properties, units, leases, etc.)
 *
 * @example
 * // Basic edit/delete
 * <EntityActions
 *   onEdit={() => setEditOpen(true)}
 *   onDelete={() => deleteMutation.mutate(item.id)}
 *   isDeletePending={deleteMutation.isPending}
 *   deleteTitle="Delete property?"
 *   deleteDescription="This property will be removed. This can't be undone."
 *   stopTriggerPropagation
 * />
 *
 * @example
 * // With additional actions
 * <EntityActions
 *   onEdit={() => setEditOpen(true)}
 *   onDelete={() => deleteMutation.mutate(item.id)}
 *   isDeletePending={deleteMutation.isPending}
 *   deleteTitle="Delete lease?"
 *   deleteDescription="This can't be undone."
 *   additionalItems={[
 *     {
 *       label: 'View PDF',
 *       icon: <FileText className="size-4 shrink-0" />,
 *       onClick: () => window.open(lease.pdfUrl),
 *     },
 *   ]}
 * />
 */
export function EntityActions({
	label = 'Actions',
	onEdit,
	onDelete,
	isDeletePending = false,
	additionalItems = [],
	stopTriggerPropagation = false,
	deleteTitle,
	deleteDescription,
}: EntityActionsProps) {
	const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

	const handleDeleteConfirm = () => {
		setDeleteConfirmOpen(false)
		onDelete()
	}

	const items: ActionItem[] = [
		...additionalItems,
		...(onEdit
			? [
					{
						label: 'Edit',
						icon: <Pencil className="size-4 shrink-0" />,
						onClick: onEdit,
					},
			  ]
			: []),
		{
			label: 'Delete',
			icon: <Trash2 className="size-4 shrink-0" />,
			onClick: () => setDeleteConfirmOpen(true),
			variant: 'destructive' as const,
			disabled: isDeletePending,
		},
	]

	return (
		<>
			<ActionsPopover
				label={label}
				items={items}
				stopTriggerPropagation={stopTriggerPropagation}
			/>
			<ConfirmDeleteDialog
				open={deleteConfirmOpen}
				onOpenChange={setDeleteConfirmOpen}
				title={deleteTitle}
				description={deleteDescription}
				onConfirm={handleDeleteConfirm}
				isPending={isDeletePending}
			/>
		</>
	)
}
