import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '@abumble/design-system/components/Card'
import { Badge } from '@abumble/design-system/components/Badge'
import { Button } from '@abumble/design-system/components/Button'
import { ConfirmDeleteDialog } from '@abumble/design-system/components/ConfirmDeleteDialog'
import { DelayedLoadingFallback } from '@abumble/design-system/components/DelayedLoadingFallback'
import { useMembershipById, useDeleteMembership } from '@/features/memberships'
import { useResendInvite } from '@/features/invites/hooks'
import { membershipKeys } from '@/features/memberships/keys'
import { useMemberScopesList } from '@/features/member-scopes/hooks'
import { useQueryErrorToast } from '@/lib/hooks'
import { config } from '@/config'
import { DetailField } from '@/components/ui'
import { InviteStatusBadge } from '@/components/InviteStatusBadge'
import { formatDateTime } from '@/lib/format'
import { InviteStatus } from '@/domain/membership'
import { RotateCcw, Trash2 } from 'lucide-react'

export interface MembershipDetailViewProps {
	orgId: string
	membershipId: string
}

export function MembershipDetailView({
	orgId,
	membershipId,
}: MembershipDetailViewProps) {
	const navigate = useNavigate()
	const {
		data: membership,
		isLoading,
		isError,
		error,
	} = useMembershipById(orgId, membershipId)
	const { data: scopes, isLoading: isLoadingScopes } = useMemberScopesList(
		orgId,
		membershipId,
	)
	const deleteMembership = useDeleteMembership()
	const resendInvite = useResendInvite()
	const queryClient = useQueryClient()
	const [confirmOpen, setConfirmOpen] = useState(false)
	const [confirmAction, setConfirmAction] = useState<'remove' | 'revoke' | null>(null)

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

	const handleConfirm = () => {
		setConfirmOpen(false)
		deleteMembership.mutate(
			{ orgId, membershipId },
			{
				onSuccess: () => {
					toast.success(
						confirmAction === 'remove' ? 'Member removed' : 'Invitation revoked',
					)
					navigate({ to: '/organization/members', search: { orgId } })
				},
			},
		)
	}

	const openConfirm = (action: 'remove' | 'revoke') => {
		setConfirmAction(action)
		setConfirmOpen(true)
	}

	return (
		<>
			<div className="space-y-6">
				<DelayedLoadingFallback
					isLoading={isLoading}
					delayMs={config.loadingFallbackDelayMs}
					fallback={<div className="h-48 animate-pulse rounded bg-muted" />}
				>
					{membership && (
						<Card>
							<CardHeader className="flex flex-row items-center justify-between">
								<div className="space-y-1">
									<CardTitle>
										{membership.userName ||
											membership.inviteEmail ||
											'Pending Member'}
									</CardTitle>
									<div className="flex gap-2">
										<InviteStatusBadge
											status={
												membership.userId
													? 'ACTIVE'
													: (membership.inviteStatus ?? 'PENDING')
											}
											lastResentAt={membership.lastResentAt}
											expiresAt={membership.expiresAt}
										/>
									</div>
								</div>
								<div className="flex gap-2">
									{canResend && membership.inviteId && (
										<Button
											variant="outline"
											onClick={handleResend}
											disabled={resendInvite.isPending}
										>
											<RotateCcw className="mr-2 h-4 w-4" />
											Resend Invitation
										</Button>
									)}
									{canRevoke && (
										<Button
											variant="destructive"
											onClick={() => openConfirm('revoke')}
											disabled={deleteMembership.isPending}
										>
											<Trash2 className="mr-2 h-4 w-4" />
											Revoke Invitation
										</Button>
									)}
									{canRemove && (
										<Button
											variant="destructive"
											onClick={() => openConfirm('remove')}
											disabled={deleteMembership.isPending}
										>
											<Trash2 className="mr-2 h-4 w-4" />
											Remove Member
										</Button>
									)}
								</div>
							</CardHeader>
							<CardContent className="grid gap-6 sm:grid-cols-2">
								<DetailField label="Email">
									{membership.userEmail || membership.inviteEmail}
								</DetailField>
								<DetailField label="Joined">
									{formatDateTime(membership.createdAt)}
								</DetailField>
							</CardContent>
						</Card>
					)}
				</DelayedLoadingFallback>

				<Card>
					<CardHeader>
						<CardTitle>Permissions & Scopes</CardTitle>
					</CardHeader>
					<CardContent>
						<DelayedLoadingFallback
							isLoading={isLoadingScopes}
							delayMs={config.loadingFallbackDelayMs}
							fallback={<div className="h-24 animate-pulse rounded bg-muted" />}
						>
							{!scopes || scopes.length === 0 ? (
								<p className="text-sm text-muted-foreground">
									This member has no active permissions.
								</p>
							) : (
								<div className="space-y-4">
									{scopes.map((scope) => (
										<div key={scope.id} className="rounded-lg border p-4">
											<div className="flex items-center justify-between mb-2">
												<span className="font-semibold text-sm">
													{scope.scopeType} Scope
												</span>
												<Badge variant="outline">{scope.scopeId}</Badge>
											</div>
											<pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
												{JSON.stringify(scope.permissions, null, 2)}
											</pre>
										</div>
									))}
								</div>
							)}
						</DelayedLoadingFallback>
					</CardContent>
				</Card>
			</div>
			<ConfirmDeleteDialog
				open={confirmOpen}
				onOpenChange={setConfirmOpen}
				title={
					confirmAction === 'remove' ? 'Remove member?' : 'Revoke invitation?'
				}
				description={
					confirmAction === 'remove'
						? `This will remove ${membership?.userName ?? membership?.userEmail} from the organization and revoke all their access.`
						: `The invitation to ${membership?.inviteEmail} will be cancelled. You can re-invite them later.`
				}
				onConfirm={handleConfirm}
				isPending={deleteMembership.isPending}
			/>
		</>
	)
}
