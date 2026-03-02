import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { RotateCcw, UserMinus, Ban, Plus } from 'lucide-react'
import { BannerHeader } from '@abumble/design-system/components/BannerHeader'
import { Button } from '@abumble/design-system/components/Button'
import { ActionsPopover } from '@abumble/design-system/components/ActionsPopover'
import type { ActionItem } from '@abumble/design-system/components/ActionsPopover'
import { ConfirmDeleteDialog } from '@abumble/design-system/components/ConfirmDeleteDialog'
import { DelayedLoadingFallback } from '@abumble/design-system/components/DelayedLoadingFallback'
import { Skeleton } from '@abumble/design-system/components/Skeleton'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@abumble/design-system/components/Dialog'
import { useMembershipById, useDeleteMembership } from '@/features/memberships'
import { useResendInvite, useRevokeInvite } from '@/features/invites/hooks'
import { membershipKeys } from '@/features/memberships/keys'
import { usePolicyAssignmentsList } from '@/features/policy-assignments/hooks'
import { CreateAssignmentForm } from '@/features/policy-assignments/components/forms'
import { AssignmentAccordionItem } from '@/features/policy-assignments/components/AssignmentAccordionItem'
import { Accordion } from '@/components/ui/accordion'
import { usePropsList } from '@/features/props'
import { useUnitsList } from '@/features/units'
import { useOrganization } from '@/contexts/organization'
import { useQueryErrorToast } from '@/lib/hooks'
import { config } from '@/config'
import { DetailField } from '@/components/ui'
import { CenteredEmptyState } from '@/components/CenteredEmptyState'
import { TextLink } from '@/components/ui'
import { InviteStatusBadge } from '@/components/InviteStatusBadge'
import { formatDate, formatDateTime } from '@/lib/format'
import { InviteStatus } from '@/domain/membership'
import { ResourceType } from '@/domain/policy-assignment'
import { FORM_DIALOG_CLASS } from '@/lib/dialog'

export interface MembershipDetailViewProps {
	membershipId: string
}

// ---------- Member actions dropdown ----------

interface MemberActionsProps {
	canResend: boolean
	canRevoke: boolean
	canRemove: boolean
	isResendPending: boolean
	isRevokePending: boolean
	isRemovePending: boolean
	onResend: () => void
	onRevoke: () => void
	onRemove: () => void
}

function MemberActions({
	canResend,
	canRevoke,
	canRemove,
	isResendPending,
	isRevokePending,
	isRemovePending,
	onResend,
	onRevoke,
	onRemove,
}: MemberActionsProps) {
	const [confirmOpen, setConfirmOpen] = useState(false)
	const [confirmAction, setConfirmAction] = useState<
		'remove' | 'revoke' | null
	>(null)

	const openConfirm = (action: 'remove' | 'revoke') => {
		setConfirmAction(action)
		setConfirmOpen(true)
	}

	const handleConfirm = () => {
		setConfirmOpen(false)
		if (confirmAction === 'revoke') onRevoke()
		else onRemove()
	}

	const items: Array<ActionItem> = [
		...(canResend
			? [
					{
						label: 'Resend Invitation',
						icon: <RotateCcw className="size-4 shrink-0" />,
						onClick: onResend,
						disabled: isResendPending,
					},
				]
			: []),
		...(canRevoke
			? [
					{
						label: 'Revoke Invitation',
						icon: <Ban className="size-4 shrink-0" />,
						onClick: () => openConfirm('revoke'),
						variant: 'destructive' as const,
						disabled: isRevokePending,
					},
				]
			: []),
		...(canRemove
			? [
					{
						label: 'Remove Member',
						icon: <UserMinus className="size-4 shrink-0" />,
						onClick: () => openConfirm('remove'),
						variant: 'destructive' as const,
						disabled: isRemovePending,
					},
				]
			: []),
	]

	if (items.length === 0) return null

	return (
		<>
			<ActionsPopover label="Member actions" items={items} />
			<ConfirmDeleteDialog
				open={confirmOpen}
				onOpenChange={setConfirmOpen}
				title={
					confirmAction === 'remove' ? 'Remove member?' : 'Revoke invitation?'
				}
				description={
					confirmAction === 'remove'
						? 'This will remove them from the organization and revoke all their access. You can re-invite them later.'
						: 'The invitation will be cancelled. You can re-invite them later.'
				}
				onConfirm={handleConfirm}
				isPending={isRemovePending || isRevokePending}
			/>
		</>
	)
}

// ---------- Skeleton ----------

const detailSkeleton = (
	<div className="flex flex-col gap-6">
		<div className="flex items-center gap-3">
			<Skeleton className="h-9 w-9 rounded" />
			<div className="space-y-1.5">
				<Skeleton className="h-7 w-48" />
				<Skeleton className="h-4 w-32" />
			</div>
		</div>
		<div className="grid gap-4 lg:grid-cols-[1fr_260px]">
			<div className="rounded border bg-card px-5 py-4">
				<div className="grid gap-4 sm:grid-cols-2">
					{Array.from({ length: 4 }).map((_, i) => (
						<div key={i} className="space-y-2">
							<Skeleton className="h-3 w-20" />
							<Skeleton className="h-5 w-full" />
						</div>
					))}
				</div>
			</div>
			<div className="rounded border bg-card px-5 py-4">
				<div className="flex flex-col gap-4">
					{[1, 2, 3].map((i) => (
						<div key={i} className="space-y-2">
							<Skeleton className="h-3 w-16" />
							<Skeleton className="h-5 w-full" />
						</div>
					))}
				</div>
			</div>
		</div>
		<div className="rounded border bg-card">
			<div className="px-5 py-4 border-b">
				<Skeleton className="h-5 w-40" />
			</div>
			<div className="px-5 py-4">
				<Skeleton className="h-16 w-full" />
			</div>
		</div>
	</div>
)

// ---------- Main view ----------

export function MembershipDetailView({ membershipId }: MembershipDetailViewProps) {
	const { activeOrgId } = useOrganization()
	const navigate = useNavigate()

	// Guard: should not render without an active org (route already ensures this)
	if (!activeOrgId) return null

	const orgId = activeOrgId
	const {
		data: membership,
		isLoading,
		isError,
		error,
	} = useMembershipById(orgId, membershipId)
	const { data: assignments, isLoading: isLoadingAssignments } =
		usePolicyAssignmentsList(orgId, membershipId)
	const { data: props } = usePropsList()
	const { data: units } = useUnitsList()

	const deleteMembership = useDeleteMembership()
	const resendInvite = useResendInvite()
	const revokeInvite = useRevokeInvite()
	const queryClient = useQueryClient()

	const [addAssignmentOpen, setAddAssignmentOpen] = useState(false)

	useQueryErrorToast(isError, error, 'membership')

	const canResend =
		membership?.inviteStatus === InviteStatus.PENDING ||
		membership?.inviteStatus === InviteStatus.EXPIRED
	const canRevoke = canResend
	const canRemove = !!membership?.userId

	const handleResend = () => {
		if (!membership?.inviteId) return
		resendInvite.mutate(membership.inviteId, {
			onSuccess: () => toast.success('Invitation resent'),
			onSettled: () => {
				queryClient.invalidateQueries({ queryKey: membershipKeys.list(orgId) })
				queryClient.invalidateQueries({
					queryKey: membershipKeys.detail(orgId, membershipId),
				})
			},
		})
	}

	const handleRevoke = () => {
		if (!membership?.inviteId) return
		revokeInvite.mutate(membership.inviteId, {
			onSuccess: () => toast.success('Invitation revoked'),
			onSettled: () => {
				queryClient.invalidateQueries({
					queryKey: membershipKeys.detail(orgId, membershipId),
				})
				queryClient.invalidateQueries({ queryKey: membershipKeys.list(orgId) })
			},
		})
	}

	const handleRemove = () => {
		deleteMembership.mutate(
			{ orgId, membershipId },
			{
				onSuccess: () => {
					toast.success('Member removed')
					navigate({ to: '/organization/members', search: { orgId } })
				},
			},
		)
	}

	const resolveResourceName = (type: ResourceType, id: string) => {
		if (type === ResourceType.ORG) return 'Organization'
		if (type === ResourceType.PROPERTY) {
			return props?.find((p) => p.id === id)?.legalName ?? id
		}
		if (type === ResourceType.UNIT) {
			return units?.find((u) => u.id === id)?.unitNumber ?? id
		}
		return id
	}

	const displayName =
		membership?.userName || membership?.inviteEmail || 'Pending Member'
	const displayEmail = membership?.userEmail || membership?.inviteEmail
	const inviteStatusValue = membership?.userId
		? 'ACTIVE'
		: (membership?.inviteStatus ?? 'PENDING')

	return (
		<DelayedLoadingFallback
			isLoading={isLoading}
			delayMs={config.loadingFallbackDelayMs}
			fallback={detailSkeleton}
		>
			{isError || !membership ? (
				<CenteredEmptyState
					title="Member not found"
					description={
						isError
							? error?.message || 'Failed to load member'
							: 'The member you were looking for was not found.'
					}
					action={
						<TextLink to="/organization/members" search={{ orgId }}>
							Back to members
						</TextLink>
					}
				/>
			) : (
				<div className="flex flex-col gap-6">
					<BannerHeader
						linkComponent={Link}
						backLink={{ label: 'Back to members' }}
						title={displayName}
						description={
							<>
								<InviteStatusBadge
									status={
										inviteStatusValue as
											| 'ACTIVE'
											| 'PENDING'
											| 'ACCEPTED'
											| 'EXPIRED'
											| 'REVOKED'
									}
									lastResentAt={membership.lastResentAt}
									expiresAt={membership.expiresAt}
								/>
								{displayEmail && (
									<span className="text-muted-foreground">
										{' '}
										&middot; {displayEmail}
									</span>
								)}
							</>
						}
						actions={
							<MemberActions
								canResend={canResend}
								canRevoke={canRevoke}
								canRemove={canRemove}
								isResendPending={resendInvite.isPending}
								isRevokePending={revokeInvite.isPending}
								isRemovePending={deleteMembership.isPending}
								onResend={handleResend}
								onRevoke={handleRevoke}
								onRemove={handleRemove}
							/>
						}
					/>

					{/* Two-column body */}
					<div className="grid gap-4 lg:grid-cols-[1fr_260px]">
						{/* Left: member info */}
						<div className="rounded border bg-card px-5 py-4">
							<div className="grid gap-4 sm:grid-cols-2">
								<DetailField label="Email">{displayEmail ?? '—'}</DetailField>
								{membership.userId && (
									<DetailField label="Last login">
										{membership.userLastLoggedInAt
											? formatDateTime(membership.userLastLoggedInAt)
											: 'Never'}
									</DetailField>
								)}
								{!membership.userId && membership.inviteEmail && (
									<DetailField label="Invite sent to">
										{membership.inviteEmail}
									</DetailField>
								)}
								<DetailField label="Joined">
									{formatDate(membership.createdAt)}
								</DetailField>
								{membership.expiresAt && (
									<DetailField label="Invite expires">
										{formatDateTime(membership.expiresAt)}
									</DetailField>
								)}
								{membership.orgPolicyName && (
									<DetailField label="Org policy">
										{membership.orgPolicyName}
									</DetailField>
								)}
							</div>
						</div>

						{/* Right: metadata sidebar */}
						<div className="rounded border bg-card px-5 py-4">
							<div className="flex flex-col gap-4">
								<DetailField label="Version">v{membership.version}</DetailField>
								<DetailField label="Added">
									{formatDate(membership.createdAt)}
								</DetailField>
								<DetailField label="Last updated">
									{formatDate(membership.updatedAt)}
								</DetailField>
							</div>
						</div>
					</div>

					{/* Permissions & Assignments */}
					<div className="rounded border bg-card">
						<div className="flex items-center justify-between border-b px-5 py-4">
							<div>
								<h3 className="font-semibold text-foreground">
									Permissions &amp; Assignments
								</h3>
								<p className="text-sm text-muted-foreground mt-0.5">
									Controls what this member can access and do.
								</p>
							</div>
							<Button size="sm" onClick={() => setAddAssignmentOpen(true)}>
								<Plus className="size-4" />
								Add
							</Button>
						</div>

						<DelayedLoadingFallback
							isLoading={isLoadingAssignments}
							delayMs={config.loadingFallbackDelayMs}
							fallback={
								<div className="px-5 py-4">
									<div className="h-20 animate-pulse rounded bg-muted" />
								</div>
							}
						>
							{!assignments || assignments.length === 0 ? (
								<div className="px-5 py-8 text-center">
									<p className="text-sm text-muted-foreground">
										No permission assignments yet.
									</p>
								</div>
							) : (
								<Accordion type="multiple" className="w-full">
									{assignments.map((assignment) => (
										<AssignmentAccordionItem
											key={assignment.id}
											orgId={orgId}
											membershipId={membershipId}
											assignment={assignment}
											resourceName={resolveResourceName(
												assignment.resourceType,
												assignment.resourceId,
											)}
										/>
									))}
								</Accordion>
							)}
						</DelayedLoadingFallback>
					</div>
				</div>
			)}

			{/* Add assignment dialog */}
			<Dialog open={addAssignmentOpen} onOpenChange={setAddAssignmentOpen}>
				<DialogContent
					className={`${FORM_DIALOG_CLASS} max-h-[90vh] overflow-y-auto`}
				>
					<DialogHeader>
						<DialogTitle>Add assignment</DialogTitle>
					</DialogHeader>
					<CreateAssignmentForm
						orgId={orgId}
						membershipId={membershipId}
						onSuccess={() => setAddAssignmentOpen(false)}
						onCancel={() => setAddAssignmentOpen(false)}
					/>
				</DialogContent>
			</Dialog>
		</DelayedLoadingFallback>
	)
}
