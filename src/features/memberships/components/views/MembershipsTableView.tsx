import { useNavigate } from '@tanstack/react-router'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@abumble/design-system/components/Table'
import { Badge } from '@abumble/design-system/components/Badge'
import { DelayedLoadingFallback } from '@abumble/design-system/components/DelayedLoadingFallback'
import { useMembershipsList } from '@/features/memberships/hooks'
import { useQueryErrorToast } from '@/lib/hooks'
import { config } from '@/config'
import { TableSkeleton } from '@/components/ui'
import { formatDateTime } from '@/lib/format'
import type { Membership } from '@/domain/membership'

export interface MembershipsTableViewProps {
	orgId: string
}

export function MembershipsTableView({ orgId }: MembershipsTableViewProps) {
	const navigate = useNavigate()
	const { data: members, isLoading, isError, error } = useMembershipsList(orgId)

	useQueryErrorToast(isError, error, 'members')

	return (
		<div className="rounded border bg-card overflow-hidden">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Member</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Joined/Invited</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					<DelayedLoadingFallback
						isLoading={isLoading}
						delayMs={config.loadingFallbackDelayMs}
						fallback={<TableSkeleton columns={3} rows={5} />}
					>
						{!members || members.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={3}
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
										<StatusBadge membership={m} />
									</TableCell>
									<TableCell className="text-muted-foreground">
										{formatDateTime(m.createdAt)}
									</TableCell>
								</TableRow>
							))
						)}
					</DelayedLoadingFallback>
				</TableBody>
			</Table>
		</div>
	)
}

function StatusBadge({ membership }: { membership: Membership }) {
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
