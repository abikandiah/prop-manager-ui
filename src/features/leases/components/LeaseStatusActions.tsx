import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@abumble/design-system/components/Button'
import { FileCheck, SendHorizontal, Undo2, XCircle } from 'lucide-react'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@abumble/design-system/components/Dialog'
import type { Lease } from '@/domain/lease'
import { LeaseStatus } from '@/domain/lease'
import {
	useActivateLease,
	useRevertLeaseToDraft,
	useSubmitLeaseForReview,
	useTerminateLease,
} from '@/features/leases'

type ActionKey = 'submit' | 'activate' | 'revert' | 'terminate'

interface ActionConfig {
	label: string
	confirmLabel: string
	pendingLabel: string
	title: string
	description: string
	icon: React.ReactNode
	variant?: 'default' | 'destructive' | 'outline'
	confirmVariant?: 'default' | 'destructive'
	visibleWhen: LeaseStatus
	successMessage: string
	errorMessage: string
}

const ACTION_CONFIGS: Record<ActionKey, ActionConfig> = {
	submit: {
		label: 'Submit for review',
		confirmLabel: 'Submit',
		pendingLabel: 'Submitting…',
		title: 'Submit lease for review?',
		description:
			'This will send the lease to the tenant for review. You can revert it back to draft if changes are needed.',
		icon: <SendHorizontal className="size-4" />,
		visibleWhen: LeaseStatus.DRAFT,
		successMessage: 'Lease submitted for review',
		errorMessage: 'Failed to submit lease',
	},
	activate: {
		label: 'Activate lease',
		confirmLabel: 'Activate',
		pendingLabel: 'Activating…',
		title: 'Activate lease?',
		description:
			'This will activate the lease and make it official. The lease content will become immutable. This action cannot be undone.',
		icon: <FileCheck className="size-4" />,
		visibleWhen: LeaseStatus.REVIEW,
		successMessage: 'Lease activated',
		errorMessage: 'Failed to activate lease',
	},
	revert: {
		label: 'Revert to draft',
		confirmLabel: 'Revert',
		pendingLabel: 'Reverting…',
		title: 'Revert to draft?',
		description:
			'This will move the lease back to draft status so you can make changes. You can submit it for review again later.',
		icon: <Undo2 className="size-4" />,
		variant: 'outline',
		visibleWhen: LeaseStatus.REVIEW,
		successMessage: 'Lease reverted to draft',
		errorMessage: 'Failed to revert lease',
	},
	terminate: {
		label: 'Terminate lease',
		confirmLabel: 'Terminate',
		pendingLabel: 'Terminating…',
		title: 'Terminate lease?',
		description:
			'This will terminate the active lease early. This action cannot be undone. The lease will be marked as terminated.',
		icon: <XCircle className="size-4" />,
		variant: 'destructive',
		confirmVariant: 'destructive',
		visibleWhen: LeaseStatus.ACTIVE,
		successMessage: 'Lease terminated',
		errorMessage: 'Failed to terminate lease',
	},
}

interface LeaseStatusActionsProps {
	lease: Lease
}

export function LeaseStatusActions({ lease }: LeaseStatusActionsProps) {
	const [confirmAction, setConfirmAction] = useState<ActionKey | null>(null)

	const submitForReview = useSubmitLeaseForReview()
	const activate = useActivateLease()
	const revertToDraft = useRevertLeaseToDraft()
	const terminate = useTerminateLease()

	const mutations: Record<ActionKey, { mutate: (id: string, callbacks: { onSuccess: () => void; onError: (err: Error) => void }) => void; isPending: boolean }> = {
		submit: submitForReview,
		activate,
		revert: revertToDraft,
		terminate,
	}

	const isPending = Object.values(mutations).some((m) => m.isPending)
	const visibleActions = (Object.keys(ACTION_CONFIGS) as Array<ActionKey>).filter(
		(key) => ACTION_CONFIGS[key].visibleWhen === lease.status,
	)

	const activeConfig = confirmAction ? ACTION_CONFIGS[confirmAction] : null
	const activeMutation = confirmAction ? mutations[confirmAction] : null

	const handleConfirm = () => {
		if (!activeConfig || !activeMutation || !confirmAction) return
		activeMutation.mutate(lease.id, {
			onSuccess: () => {
				toast.success(activeConfig.successMessage)
				setConfirmAction(null)
			},
			onError: (err) => {
				toast.error(err.message || activeConfig.errorMessage)
			},
		})
	}

	return (
		<>
			<div className="flex flex-wrap gap-2">
				{visibleActions.map((key) => {
					const cfg = ACTION_CONFIGS[key]
					return (
						<Button
							key={key}
							variant={cfg.variant ?? 'default'}
							onClick={() => setConfirmAction(key)}
							disabled={isPending}
						>
							{cfg.icon}
							{cfg.label}
						</Button>
					)
				})}
			</div>

			<Dialog
				open={confirmAction !== null}
				onOpenChange={(open) => {
					if (!open) setConfirmAction(null)
				}}
			>
				{activeConfig && (
					<DialogContent>
						<DialogHeader>
							<DialogTitle>{activeConfig.title}</DialogTitle>
							<DialogDescription>{activeConfig.description}</DialogDescription>
						</DialogHeader>
						<DialogFooter>
							<Button
								variant="outline"
								onClick={() => setConfirmAction(null)}
								disabled={isPending}
							>
								Cancel
							</Button>
							<Button
								variant={activeConfig.confirmVariant ?? 'default'}
								onClick={handleConfirm}
								disabled={isPending}
							>
								{isPending
									? activeConfig.pendingLabel
									: activeConfig.confirmLabel}
							</Button>
						</DialogFooter>
					</DialogContent>
				)}
			</Dialog>
		</>
	)
}
