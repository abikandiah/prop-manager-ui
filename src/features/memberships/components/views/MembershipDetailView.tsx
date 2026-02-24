import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
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
import { useMemberScopesList } from '@/features/member-scopes/hooks'
import { useQueryErrorToast } from '@/lib/hooks'
import { config } from '@/config'
import { DetailField } from '@/components/ui'
import { formatDateTime } from '@/lib/format'
import { Trash2 } from 'lucide-react'
import type { Membership } from '@/domain/membership'

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
	const [revokeOpen, setRevokeOpen] = useState(false)

	useQueryErrorToast(isError, error, 'membership')

	const handleRevoke = () => {
		setRevokeOpen(false)
		deleteMembership.mutate(
			{ orgId, membershipId },
			{
				onSuccess: () => {
					toast.success('Membership revoked')
					navigate({ to: '/organization/members', search: { orgId } })
				},
			},
		)
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
										<MembershipStatusBadge membership={membership} />
									</div>
								</div>
								<Button
									variant="destructive"
									onClick={() => setRevokeOpen(true)}
									disabled={deleteMembership.isPending}
								>
									<Trash2 className="mr-2 h-4 w-4" />
									Revoke Membership
								</Button>
							</CardHeader>
							<CardContent className="grid gap-6 sm:grid-cols-2">
								<DetailField
									label="Email"
									value={membership.userEmail || membership.inviteEmail}
								/>
								<DetailField
									label="Joined"
									value={formatDateTime(membership.createdAt)}
								/>
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
				open={revokeOpen}
				onOpenChange={setRevokeOpen}
				title="Revoke membership?"
				description="This will remove all access for this user. Any pending invite will also be cancelled."
				onConfirm={handleRevoke}
				isPending={deleteMembership.isPending}
			/>
		</>
	)
}

function MembershipStatusBadge({ membership }: { membership: Membership }) {
	if (membership.userId) {
		return <Badge variant="success">Active</Badge>
	}

	switch (membership.inviteStatus) {
		case 'PENDING':
			return <Badge variant="warning">Invited</Badge>
		case 'EXPIRED':
			return <Badge variant="destructive">Expired</Badge>
		case 'REVOKED':
			return <Badge variant="destructive">Revoked</Badge>
		case 'ACCEPTED':
			return <Badge variant="success">Accepted</Badge>
		default:
			return <Badge variant="outline">Pending</Badge>
	}
}
