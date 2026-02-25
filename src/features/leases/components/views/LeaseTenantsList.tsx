import { useState } from 'react'
import { toast } from 'sonner'
import { UserPlus, Trash2, Send } from 'lucide-react'
import { Badge } from '@abumble/design-system/components/Badge'
import { Button } from '@abumble/design-system/components/Button'
import { ActionsPopover } from '@abumble/design-system/components/ActionsPopover'
import { ConfirmDeleteDialog } from '@abumble/design-system/components/ConfirmDeleteDialog'
import { DelayedLoadingFallback } from '@abumble/design-system/components/DelayedLoadingFallback'
import { FormDialog } from '@abumble/design-system/components/Dialog'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@abumble/design-system/components/Tooltip'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@abumble/design-system/components/Table'
import { Skeleton } from '@abumble/design-system/components/Skeleton'
import type { LeaseTenant, LeaseTenantStatus } from '@/domain/lease-tenant'
import { EmailDeliveryStatus, LeaseTenantRole } from '@/domain/lease-tenant'
import { DETAIL_LABEL_CLASS } from '@/components/ui/DetailField'
import { formatDate, formatDateTime, formatEnumLabel } from '@/lib/format'
import { FORM_DIALOG_CLASS, useDialogState } from '@/lib/dialog'
import { config } from '@/config'
import {
	useLeaseTenants,
	useRemoveLeaseTenant,
	useResendLeaseTenantInvite,
} from '@/features/leases/hooks'
import { InviteTenantsForm } from '../forms/InviteTenantsForm'

// ---------- Badge helpers ----------

type BadgeVariant =
	| 'default'
	| 'secondary'
	| 'success'
	| 'warning'
	| 'destructive'
	| 'outline'

function statusVariant(status: LeaseTenantStatus): BadgeVariant {
	switch (status) {
		case 'INVITED':
			return 'warning'
		case 'REGISTERED':
			return 'secondary'
		case 'SIGNED':
			return 'success'
		default:
			return 'default'
	}
}

function roleVariant(role: LeaseTenant['role']): BadgeVariant {
	return role === LeaseTenantRole.PRIMARY ? 'default' : 'outline'
}

// ---------- Skeleton ----------

function TenantsSkeleton({ showActions }: { showActions: boolean }) {
	return (
		<div className="rounded-lg border bg-card overflow-hidden">
			<div className="flex items-center justify-between px-5 py-4">
				<p className={DETAIL_LABEL_CLASS}>Tenants</p>
				{showActions && <Skeleton className="h-8 w-32" />}
			</div>
			<Table className="[&_th:first-child]:pl-5 [&_td:first-child]:pl-5 [&_th:last-child]:pr-5 [&_td:last-child]:pr-5">
				<TableHeader>
					<TableRow>
						<TableHead>Email</TableHead>
						<TableHead>Role</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Invited</TableHead>
						{showActions && <TableHead className="w-12" />}
					</TableRow>
				</TableHeader>
				<TableBody>
					{[1, 2].map((i) => (
						<TableRow key={i}>
							<TableCell>
								<Skeleton className="h-4 w-48" />
							</TableCell>
							<TableCell>
								<Skeleton className="h-5 w-20 rounded-full" />
							</TableCell>
							<TableCell>
								<Skeleton className="h-5 w-20 rounded-full" />
							</TableCell>
							<TableCell>
								<Skeleton className="h-4 w-24" />
							</TableCell>
							{showActions && (
								<TableCell>
									<Skeleton className="h-8 w-8 rounded" />
								</TableCell>
							)}
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	)
}

// ---------- Row actions ----------

interface TenantRowActionsProps {
	tenant: LeaseTenant
	leaseId: string
	isDraft: boolean
}

function TenantRowActions({ tenant, leaseId, isDraft }: TenantRowActionsProps) {
	const [confirmOpen, setConfirmOpen] = useState(false)
	const removeTenant = useRemoveLeaseTenant()
	const resendInvite = useResendLeaseTenantInvite()

	const canResend = tenant.status === 'INVITED'
	const canRemove = isDraft && tenant.status !== 'SIGNED'

	if (!canResend && !canRemove) return null

	const handleResend = () => {
		resendInvite.mutate(
			{
				leaseId,
				leaseTenantId: tenant.id,
				inviteId: tenant.inviteId,
				email: tenant.email,
			},
			{
				onSuccess: () => {
					toast.success(`Invitation resent to ${tenant.email}`)
				},
			},
		)
	}

	const handleRemoveConfirm = () => {
		removeTenant.mutate(
			{ leaseId, leaseTenantId: tenant.id },
			{
				onSuccess: () => {
					toast.success(`${tenant.email} removed from this lease`)
				},
				onSettled: () => {
					setConfirmOpen(false)
				},
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
		...(canRemove
			? [
					{
						label: 'Remove',
						icon: <Trash2 className="size-4" />,
						onClick: () => setConfirmOpen(true),
						variant: 'destructive' as const,
						disabled: removeTenant.isPending,
					},
				]
			: []),
	]

	return (
		<>
			<ActionsPopover
				label={`Actions for ${tenant.email}`}
				items={actions}
				stopTriggerPropagation
			/>

			{canRemove && (
				<ConfirmDeleteDialog
					open={confirmOpen}
					onOpenChange={setConfirmOpen}
					title="Remove tenant?"
					description={
						<>
							<strong>{tenant.email}</strong> will be removed from this lease
							and their invite will be revoked. This can&apos;t be undone.
						</>
					}
					onConfirm={handleRemoveConfirm}
					isPending={removeTenant.isPending}
				/>
			)}
		</>
	)
}

// ---------- Main component ----------

export interface LeaseTenantListProps {
	leaseId: string
	/** Controls invite/remove visibility — only available on DRAFT leases. */
	isDraft: boolean
}

const TABLE_COLS_BASE = 4
const TABLE_COLS_WITH_ACTIONS = TABLE_COLS_BASE + 1

/**
 * Displays a list of tenants for a lease.
 * - INVITED tenants always get a "Resend invite" action (regardless of lease status).
 * - In DRAFT mode: also shows "Invite tenants" button and a per-row "Remove" action
 *   (only for tenants who haven't signed yet).
 * - The INVITED status badge shows a tooltip with the last resent timestamp.
 */
export function LeaseTenantsList({ leaseId, isDraft }: LeaseTenantListProps) {
	const inviteDialog = useDialogState()
	const { data: tenants = [], isLoading } = useLeaseTenants(leaseId)

	const hasActions = isDraft || tenants.some((t) => t.status === 'INVITED')
	const totalCols = hasActions ? TABLE_COLS_WITH_ACTIONS : TABLE_COLS_BASE

	const tableContent = (
		<TooltipProvider>
			<div className="rounded-lg border bg-card overflow-hidden">
				{/* Card header */}
				<div className="flex items-center justify-between px-5 py-4">
					<p className={DETAIL_LABEL_CLASS}>Tenants</p>
					{isDraft && (
						<Button variant="outline" size="sm" onClick={inviteDialog.open}>
							<UserPlus className="size-4" />
							Invite tenants
						</Button>
					)}
				</div>

				{/* Table */}
				<Table className="[&_th:first-child]:pl-5 [&_td:first-child]:pl-5 [&_th:last-child]:pr-5 [&_td:last-child]:pr-5">
					<TableHeader>
						<TableRow>
							<TableHead>Email</TableHead>
							<TableHead>Role</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Invited</TableHead>
							{hasActions && <TableHead className="w-12" />}
						</TableRow>
					</TableHeader>
					<TableBody>
						{tenants.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={totalCols}
									className="h-20 text-center text-muted-foreground"
								>
									{isDraft
										? 'No tenants yet. Use "Invite tenants" to add people to this lease.'
										: 'No tenants on this lease.'}
								</TableCell>
							</TableRow>
						) : (
							tenants.map((tenant) => (
								<TableRow key={tenant.id}>
									<TableCell className="font-medium">{tenant.email}</TableCell>
									<TableCell>
										<Badge variant={roleVariant(tenant.role)}>
											{formatEnumLabel(tenant.role)}
										</Badge>
									</TableCell>
									<TableCell>
										{tenant.status === 'INVITED' &&
										tenant.emailStatus === EmailDeliveryStatus.FAILED ? (
											<Tooltip>
												<TooltipTrigger asChild>
													<Badge variant="destructive">Email failed</Badge>
												</TooltipTrigger>
												<TooltipContent>
													{tenant.emailError ??
														'Email could not be delivered. Use "Resend invite" to try again.'}
												</TooltipContent>
											</Tooltip>
										) : tenant.status === 'INVITED' && tenant.lastResentAt ? (
											<Tooltip>
												<TooltipTrigger asChild>
													<Badge variant={statusVariant(tenant.status)}>
														{formatEnumLabel(tenant.status)}
													</Badge>
												</TooltipTrigger>
												<TooltipContent>
													Resent {formatDateTime(tenant.lastResentAt)}
												</TooltipContent>
											</Tooltip>
										) : (
											<Badge variant={statusVariant(tenant.status)}>
												{formatEnumLabel(tenant.status)}
											</Badge>
										)}
									</TableCell>
									<TableCell className="text-muted-foreground">
										{formatDate(tenant.invitedDate)}
									</TableCell>
									{hasActions && (
										<TableCell>
											<TenantRowActions
												tenant={tenant}
												leaseId={leaseId}
												isDraft={isDraft}
											/>
										</TableCell>
									)}
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>
		</TooltipProvider>
	)

	return (
		<>
			<DelayedLoadingFallback
				isLoading={isLoading}
				delayMs={config.loadingFallbackDelayMs}
				fallback={<TenantsSkeleton showActions={isDraft} />}
			>
				{tableContent}
			</DelayedLoadingFallback>

			{/* Invite dialog — rendered outside DelayedLoadingFallback so it stays mounted */}
			{isDraft && (
				<FormDialog
					open={inviteDialog.isOpen}
					onOpenChange={inviteDialog.setIsOpen}
					title="Invite tenants"
					description="Add people to this lease. They'll receive an email with a link to review and sign."
					className={FORM_DIALOG_CLASS}
				>
					<InviteTenantsForm
						leaseId={leaseId}
						onSuccess={inviteDialog.close}
						onCancel={inviteDialog.close}
					/>
				</FormDialog>
			)}
		</>
	)
}
