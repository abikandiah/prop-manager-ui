import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@abumble/design-system/components/Button'
import { FileCheck, SendHorizontal, Undo2, XCircle } from 'lucide-react'
import type { Lease } from '@/domain/lease'
import {
	useSubmitLeaseForReview,
	useActivateLease,
	useRevertLeaseToDraft,
	useTerminateLease,
} from '@/features/leases'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'

interface LeaseStatusActionsProps {
	lease: Lease
}

export function LeaseStatusActions({ lease }: LeaseStatusActionsProps) {
	const [confirmAction, setConfirmAction] = useState<
		'submit' | 'activate' | 'revert' | 'terminate' | null
	>(null)

	const submitForReview = useSubmitLeaseForReview()
	const activate = useActivateLease()
	const revertToDraft = useRevertLeaseToDraft()
	const terminate = useTerminateLease()

	const handleSubmitForReview = () => {
		submitForReview.mutate(
			{ id: lease.id, unitId: lease.unitId, propertyId: lease.propertyId },
			{
				onSuccess: () => {
					toast.success('Lease submitted for review')
					setConfirmAction(null)
				},
				onError: (err) => {
					toast.error(err.message || 'Failed to submit lease')
				},
			},
		)
	}

	const handleActivate = () => {
		activate.mutate(
			{ id: lease.id, unitId: lease.unitId, propertyId: lease.propertyId },
			{
				onSuccess: () => {
					toast.success('Lease activated')
					setConfirmAction(null)
				},
				onError: (err) => {
					toast.error(err.message || 'Failed to activate lease')
				},
			},
		)
	}

	const handleRevert = () => {
		revertToDraft.mutate(
			{ id: lease.id, unitId: lease.unitId, propertyId: lease.propertyId },
			{
				onSuccess: () => {
					toast.success('Lease reverted to draft')
					setConfirmAction(null)
				},
				onError: (err) => {
					toast.error(err.message || 'Failed to revert lease')
				},
			},
		)
	}

	const handleTerminate = () => {
		terminate.mutate(
			{ id: lease.id, unitId: lease.unitId, propertyId: lease.propertyId },
			{
				onSuccess: () => {
					toast.success('Lease terminated')
					setConfirmAction(null)
				},
				onError: (err) => {
					toast.error(err.message || 'Failed to terminate lease')
				},
			},
		)
	}

	const isPending =
		submitForReview.isPending ||
		activate.isPending ||
		revertToDraft.isPending ||
		terminate.isPending

	return (
		<>
			<div className="flex flex-wrap gap-2">
				{lease.status === 'DRAFT' && (
					<Button
						onClick={() => setConfirmAction('submit')}
						disabled={isPending}
					>
						<SendHorizontal className="size-4" />
						Submit for review
					</Button>
				)}

				{lease.status === 'PENDING_REVIEW' && (
					<>
						<Button
							onClick={() => setConfirmAction('activate')}
							disabled={isPending}
						>
							<FileCheck className="size-4" />
							Activate lease
						</Button>
						<Button
							variant="outline"
							onClick={() => setConfirmAction('revert')}
							disabled={isPending}
						>
							<Undo2 className="size-4" />
							Revert to draft
						</Button>
					</>
				)}

				{lease.status === 'ACTIVE' && (
					<Button
						variant="destructive"
						onClick={() => setConfirmAction('terminate')}
						disabled={isPending}
					>
						<XCircle className="size-4" />
						Terminate lease
					</Button>
				)}
			</div>

			{/* Submit for Review Confirmation */}
			<Dialog
				open={confirmAction === 'submit'}
				onOpenChange={() => setConfirmAction(null)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Submit lease for review?</DialogTitle>
						<DialogDescription>
							This will send the lease to the tenant for review. You can revert
							it back to draft if changes are needed.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setConfirmAction(null)}
							disabled={isPending}
						>
							Cancel
						</Button>
						<Button onClick={handleSubmitForReview} disabled={isPending}>
							{isPending ? 'Submitting…' : 'Submit'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Activate Confirmation */}
			<Dialog
				open={confirmAction === 'activate'}
				onOpenChange={() => setConfirmAction(null)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Activate lease?</DialogTitle>
						<DialogDescription>
							This will activate the lease and make it official. The lease
							content will become immutable. This action cannot be undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setConfirmAction(null)}
							disabled={isPending}
						>
							Cancel
						</Button>
						<Button onClick={handleActivate} disabled={isPending}>
							{isPending ? 'Activating…' : 'Activate'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Revert to Draft Confirmation */}
			<Dialog
				open={confirmAction === 'revert'}
				onOpenChange={() => setConfirmAction(null)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Revert to draft?</DialogTitle>
						<DialogDescription>
							This will move the lease back to draft status so you can make
							changes. You can submit it for review again later.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setConfirmAction(null)}
							disabled={isPending}
						>
							Cancel
						</Button>
						<Button onClick={handleRevert} disabled={isPending}>
							{isPending ? 'Reverting…' : 'Revert'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Terminate Confirmation */}
			<Dialog
				open={confirmAction === 'terminate'}
				onOpenChange={() => setConfirmAction(null)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Terminate lease?</DialogTitle>
						<DialogDescription>
							This will terminate the active lease early. This action cannot be
							undone. The lease will be marked as TERMINATED.
						</DialogDescription>
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
							variant="destructive"
							onClick={handleTerminate}
							disabled={isPending}
						>
							{isPending ? 'Terminating…' : 'Terminate'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	)
}
