import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { Send, Trash2 } from 'lucide-react'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@abumble/design-system/components/Table'
import { ActionsPopover } from '@abumble/design-system/components/ActionsPopover'
import { ConfirmDeleteDialog } from '@abumble/design-system/components/ConfirmDeleteDialog'
import { DelayedLoadingFallback } from '@abumble/design-system/components/DelayedLoadingFallback'
import { useQueryClient } from '@tanstack/react-query'
import { useResendInvite } from '@/features/invites/hooks'
import { useMembershipsList, useDeleteMembership } from '@/features/memberships/hooks'
import { membershipKeys } from '@/features/memberships/keys'
import { useQueryErrorToast } from '@/lib/hooks'
import { config } from '@/config'
import { TableSkeleton } from '@/components/ui'
import { InviteStatusBadge } from '@/components/InviteStatusBadge'
import { formatDateTime } from '@/lib/format'
import { InviteStatus } from '@/domain/membership'
import type { Membership } from '@/domain/membership'

export interface MembershipsTableViewProps {
	orgId: string
}

export function MembershipsTableView({ orgId }: MembershipsTableViewProps) {
	const navigate = useNavigate()
	const { data: members, isLoading, isError, error } = useMembershipsList(orgId)

	useQueryErrorToast(isError, error, 'members')

	const hasActions = members?.some(
		(m) =>
			!m.userId ||
			m.inviteStatus === InviteStatus.PENDING ||
			m.inviteStatus === InviteStatus.EXPIRED,
	)

	return (
		<div className="rounded border bg-card overflow-hidden">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Member</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Joined/Invited</TableHead>
						{hasActions && <TableHead className="w-12" />}
					</TableRow>
				</TableHeader>
				<TableBody>
					<DelayedLoadingFallback
						isLoading={isLoading}
						delayMs={config.loadingFallbackDelayMs}
						fallback={
						<TableSkeleton
							headers={['Member', 'Status', 'Joined/Invited', ...(hasActions ? [''] : [])]}
							columnWidths={['w-48', 'w-24', 'w-32', ...(hasActions ? [''] : [])]}
							rows={5}
						/>
					}
					>
						{!members || members.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={hasActions ? 4 : 3}
									className="h-24 text-center text-muted-foreground"
								>
									No team members found. Invite someone above.
								</TableCell>
							</TableRow>
						) : (
							members.map((m) => (
								<TableRow
									key={m.id}
									className="cursor-pointer hover:bg-muted/50"
									onClick={() =>
										navigate({
											to: '/organization/members/$membershipId',
											params: { membershipId: m.id },
											search: { orgId },
										})
									}
									onKeyDown={(e) => {
										if (e.key === 'Enter' || e.key === ' ') {
											e.preventDefault()
											navigate({
												to: '/organization/members/$membershipId',
												params: { membershipId: m.id },
												search: { orgId },
											})
										}
									}}
									tabIndex={0}
									role="button"
								>
									<TableCell>
										<div className="flex flex-col">
											<span className="font-medium">
												{m.userName || m.inviteEmail || 'Pending Invite'}
											</span>
											{m.userName && (
												<span className="text-xs text-muted-foreground">
													{m.userEmail}
												</span>
											)}
											{!m.userName && m.inviteEmail && (
												<span className="text-xs text-muted-foreground">
													Invited
												</span>
											)}
										</div>
									</TableCell>
									<TableCell>
										<InviteStatusBadge
											status={
												m.userId
													? 'ACTIVE'
													: (m.inviteStatus ?? 'PENDING')
											}
											lastResentAt={m.lastResentAt}
											expiresAt={m.expiresAt}
										/>
									</TableCell>
									<TableCell className="text-muted-foreground">
										{formatDateTime(m.createdAt)}
									</TableCell>
									{hasActions && (
										<TableCell
											onClick={(e) => e.stopPropagation()}
											onKeyDown={(e) => e.stopPropagation()}
										>
											<MemberRowActions membership={m} orgId={orgId} />
										</TableCell>
									)}
								</TableRow>
							))
						)}
					</DelayedLoadingFallback>
				</TableBody>
			</Table>
		</div>
	)
}

function MemberRowActions({
	membership,
	orgId,
}: {
	membership: Membership
	orgId: string
}) {
	const [confirmOpen, setConfirmOpen] = useState(false)
	const resendInvite = useResendInvite()
	const deleteMembership = useDeleteMembership()
	const queryClient = useQueryClient()

	const hasPendingInvite =
		membership.inviteStatus === InviteStatus.PENDING ||
		membership.inviteStatus === InviteStatus.EXPIRED
	const canResend = hasPendingInvite
	const canRevoke = hasPendingInvite
	const canRemove = !!membership.userId

	if (!canResend && !canRemove) return null

	const handleResend = () => {
		if (!membership.inviteId) return
		resendInvite.mutate(membership.inviteId, {
			onSuccess: () => toast.success('Invitation resent'),
			onSettled: () =>
				queryClient.invalidateQueries({
					queryKey: membershipKeys.list(orgId),
				}),
		})
	}

	const handleRevoke = () => {
		// useDeleteMembership cascades — backend sets invite to REVOKED if PENDING.
		deleteMembership.mutate(
			{ orgId, membershipId: membership.id },
			{ onSuccess: () => toast.success('Invitation revoked') },
		)
	}

	const handleRemoveConfirm = () => {
		deleteMembership.mutate(
			{ orgId, membershipId: membership.id },
			{
				onSuccess: () => toast.success('Member removed'),
				onSettled: () => setConfirmOpen(false),
			},
		)
	}

	const actions = [
		...(canResend
			? [
					{
						label: 'Resend invite',
						icon: <Send className="size-4" />,
						onClick: handleResend,
						disabled: resendInvite.isPending,
					},
				]
			: []),
		...(canRevoke
			? [
					{
						label: 'Revoke invitation',
						icon: <Trash2 className="size-4" />,
						onClick: handleRevoke,
						variant: 'destructive' as const,
						disabled: deleteMembership.isPending,
					},
				]
			: []),
		...(canRemove
			? [
					{
						label: 'Remove member',
						icon: <Trash2 className="size-4" />,
						onClick: () => setConfirmOpen(true),
						variant: 'destructive' as const,
						disabled: deleteMembership.isPending,
					},
				]
			: []),
	]

	return (
		<>
			<ActionsPopover
				label={`Actions for ${membership.inviteEmail ?? membership.userName}`}
				items={actions}
				stopTriggerPropagation
			/>
			{canRemove && (
				<ConfirmDeleteDialog
					open={confirmOpen}
					onOpenChange={setConfirmOpen}
					title="Remove member?"
					description={`This will remove ${membership.userName ?? membership.userEmail} from the organization and revoke all their access.`}
					onConfirm={handleRemoveConfirm}
					isPending={deleteMembership.isPending}
				/>
			)}
		</>
	)
}
