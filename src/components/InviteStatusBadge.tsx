import { Badge } from '@abumble/design-system/components/Badge'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@abumble/design-system/components/Tooltip'
import { formatDateTime } from '@/lib/format'

export interface InviteStatusBadgeProps {
	/**
	 * Normalized status. Map at the call site before passing:
	 * - Membership: inviteStatus (null + userId present → 'ACTIVE')
	 * - LeaseTenant: INVITED → 'PENDING', REGISTERED/SIGNED → 'ACTIVE'
	 */
	status: 'ACTIVE' | 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED'
	lastResentAt?: string | null
	expiresAt?: string | null
	/** Lease-domain only — omit for memberships. */
	emailStatus?: 'NOT_SENT' | 'SENT' | 'FAILED'
	emailError?: string | null
}

export function InviteStatusBadge({
	status,
	lastResentAt,
	expiresAt,
	emailStatus,
	emailError,
}: InviteStatusBadgeProps) {
	if (status === 'ACTIVE') {
		return <Badge variant="success">Active</Badge>
	}

	if (status === 'ACCEPTED') {
		return <Badge variant="success">Accepted</Badge>
	}

	if (status === 'REVOKED') {
		return <Badge variant="destructive">Revoked</Badge>
	}

	if (status === 'PENDING' && emailStatus === 'FAILED') {
		const tooltipText =
			emailError ?? 'Email could not be delivered. Use "Resend" to try again.'
		return (
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						<Badge variant="destructive">Email failed</Badge>
					</TooltipTrigger>
					<TooltipContent>{tooltipText}</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		)
	}

	if (status === 'PENDING') {
		const hasTooltip = lastResentAt || expiresAt
		const badge = <Badge variant="warning">Invited</Badge>
		if (!hasTooltip) return badge
		return (
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>{badge}</TooltipTrigger>
					<TooltipContent className="space-y-0.5">
						{lastResentAt && (
							<p>Last resent: {formatDateTime(lastResentAt)}</p>
						)}
						{expiresAt && <p>Expires: {formatDateTime(expiresAt)}</p>}
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		)
	}

	// EXPIRED
	const badge = <Badge variant="destructive">Expired</Badge>
	if (!expiresAt) return badge
	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>{badge}</TooltipTrigger>
				<TooltipContent>
					<p>Expires: {formatDateTime(expiresAt)}</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	)
}
