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
import { Button } from '@abumble/design-system/components/Button'
import { ConfirmDeleteDialog } from '@abumble/design-system/components/ConfirmDeleteDialog'
import { DelayedLoadingFallback } from '@abumble/design-system/components/DelayedLoadingFallback'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@abumble/design-system/components/Dialog'
import { Accordion } from '@/components/ui/accordion'
import { Plus, RotateCcw, Trash2 } from 'lucide-react'
import { useMembershipById, useDeleteMembership } from '@/features/memberships'
import { useResendInvite, useRevokeInvite } from '@/features/invites/hooks'
import { membershipKeys } from '@/features/memberships/keys'
import { useMemberScopesList } from '@/features/member-scopes/hooks'
import { CreateScopeForm } from '@/features/member-scopes/components/forms'
import { ScopeAccordionItem } from '@/features/member-scopes/components/ScopeAccordionItem'
import { usePropsList } from '@/features/props'
import { useUnitsList } from '@/features/units'
import { usePermissionTemplateDetail } from '@/features/permission-templates'
import { useQueryErrorToast } from '@/lib/hooks'
import { config } from '@/config'
import { DetailField } from '@/components/ui'
import { InviteStatusBadge } from '@/components/InviteStatusBadge'
import { formatDateTime } from '@/lib/format'
import { InviteStatus } from '@/domain/membership'

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
	// Fetch resources for name resolution
	const { data: props } = usePropsList()
	const { data: units } = useUnitsList()

	// Fetch main template to show inherited permissions
	const { data: template } = usePermissionTemplateDetail(
		membership?.membershipTemplateId ?? null,
	)

	const deleteMembership = useDeleteMembership()
	const resendInvite = useResendInvite()
	const revokeInvite = useRevokeInvite()
	const queryClient = useQueryClient()

	const [confirmOpen, setConfirmOpen] = useState(false)
	const [confirmAction, setConfirmAction] = useState<
		'remove' | 'revoke' | null
	>(null)
	const [addScopeOpen, setAddScopeOpen] = useState(false)
	const [editingScopeId, setEditingScopeId] = useState<string | null>(null)

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
		if (confirmAction === 'revoke' && membership?.inviteId) {
			revokeInvite.mutate(membership.inviteId, {
				onSuccess: () => toast.success('Invitation revoked'),
				onSettled: () => {
					queryClient.invalidateQueries({
						queryKey: membershipKeys.detail(orgId, membershipId),
					})
					queryClient.invalidateQueries({
						queryKey: membershipKeys.list(orgId),
					})
				},
			})
		} else {
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
	}

	const openConfirm = (action: 'remove' | 'revoke') => {
		setConfirmAction(action)
		setConfirmOpen(true)
	}

	const resolveResourceName = (type: string, id: string) => {
		if (type === 'ORG') return 'Organization Root'
		if (type === 'PROPERTY') {
			return props?.find((p) => p.id === id)?.legalName ?? id
		}
		if (type === 'UNIT') {
			return units?.find((u) => u.id === id)?.unitNumber ?? id
		}
		return id
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
											disabled={revokeInvite.isPending}
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
					<CardHeader className="flex flex-row items-center justify-between">
						<CardTitle>Permissions & Scopes</CardTitle>
						<Button size="sm" onClick={() => setAddScopeOpen(true)}>
							<Plus className="mr-2 h-4 w-4" />
							Add Scope
						</Button>
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
								<Accordion type="multiple" className="w-full">
									{scopes.map((scope) => {
										const inherited =
											template?.items.find(
												(i) => i.scopeType === scope.scopeType,
											)?.permissions ?? {}

										return (
											<ScopeAccordionItem
												key={scope.id}
												orgId={orgId}
												membershipId={membershipId}
												scope={scope}
												resourceName={resolveResourceName(
													scope.scopeType,
													scope.scopeId,
												)}
												inheritedPermissions={inherited}
												isEditing={editingScopeId === scope.id}
												onEdit={() => setEditingScopeId(scope.id)}
												onCancelEdit={() => setEditingScopeId(null)}
												onSaveSuccess={() => setEditingScopeId(null)}
											/>
										)
									})}
								</Accordion>
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
				isPending={deleteMembership.isPending || revokeInvite.isPending}
			/>

			<Dialog open={addScopeOpen} onOpenChange={setAddScopeOpen}>
				<DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Add Scope</DialogTitle>
					</DialogHeader>
					<CreateScopeForm
						orgId={orgId}
						membershipId={membershipId}
						onSuccess={() => setAddScopeOpen(false)}
						onCancel={() => setAddScopeOpen(false)}
					/>
				</DialogContent>
			</Dialog>
		</>
	)
}
