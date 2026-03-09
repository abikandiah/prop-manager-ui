import { SectionCard } from '@/components/ui'
import { config } from '@/config'
import { useOrganization } from '@/contexts/organization'
import type { LeaseTenant } from '@/domain/lease-tenant'
import { LeaseTenantRole } from '@/domain/lease-tenant'
import { InviteStatusBadge } from '@/features/invites/components/views/InviteStatusBadge'
import { useResendInvite } from '@/features/invites/hooks'
import { useLeaseTenants, useRemoveLeaseTenant } from '@/features/leases/hooks'
import { leaseTenantKeys } from '@/features/leases/keys'
import { FORM_DIALOG_CLASS, useDialogState } from '@/lib/dialog'
import { formatDate, formatEnumLabel } from '@/lib/format'
import { ActionsPopover } from '@abumble/design-system/components/ActionsPopover'
import { Badge } from '@abumble/design-system/components/Badge'
import { Button } from '@abumble/design-system/components/Button'
import { ConfirmDeleteDialog } from '@abumble/design-system/components/ConfirmDeleteDialog'
import { DelayedLoadingFallback } from '@abumble/design-system/components/DelayedLoadingFallback'
import { FormDialog } from '@abumble/design-system/components/Dialog'
import { Skeleton } from '@abumble/design-system/components/Skeleton'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@abumble/design-system/components/Table'
import { useQueryClient } from '@tanstack/react-query'
import { Send, Trash2, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { InviteTenantsForm } from '../forms/InviteTenantsForm'

// ---------- Badge helpers ----------

function roleVariant(role: LeaseTenant['role']) {
	return role === LeaseTenantRole.PRIMARY ? 'default' : ('outline' as const)
}

// ---------- Skeleton ----------

function TenantsSkeleton({ showActions }: { showActions: boolean }) {
	return (
		<SectionCard
			title="Tenants"
			className="overflow-hidden"
			actions={showActions ? <Skeleton className="h-8 w-32" /> : null}
		>
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
		</SectionCard>
	)
}

// ---------- Row actions ----------

interface TenantRowActionsProps {
	tenant: LeaseTenant
	leaseId: string
	isDraft: boolean
	/** True when the lease is in REVIEW (unsigned tenants can still be removed). */
	isReview: boolean
}

function TenantRowActions({
	tenant,
	leaseId,
	isDraft,
	isReview,
}: TenantRowActionsProps) {
	const [confirmOpen, setConfirmOpen] = useState(false)
	const removeTenant = useRemoveLeaseTenant()
	const resendInvite = useResendInvite()
	const queryClient = useQueryClient()
	const { activeOrgId } = useOrganization()

	const canResend = tenant.status === 'INVITED'
	const canRemove = (isDraft || isReview) && tenant.status !== 'SIGNED'

	if (!canResend && !canRemove) return null

	const handleResend = () => {
		resendInvite.mutate(tenant.inviteId, {
			onSuccess: () => {
				toast.success(`Invitation resent to ${tenant.email}`)
			},
			onSettled: () => {
				queryClient.invalidateQueries({
					queryKey: leaseTenantKeys.list(activeOrgId!, leaseId),
				})
			},
		})
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
	/** True for DRAFT leases — shows the "Invite tenants" button and enables removal. */
	isDraft: boolean
	/** True for REVIEW leases — enables removal of unsigned tenants only. */
	isReview?: boolean
}

const TABLE_COLS_BASE = 4
const TABLE_COLS_WITH_ACTIONS = TABLE_COLS_BASE + 1

/**
 * Displays a list of tenants for a lease.
 * - INVITED tenants always get a "Resend invite" action (regardless of lease status).
 * - In DRAFT/REVIEW mode: a per-row "Remove" action appears for unsigned tenants.
 * - In DRAFT mode only: also shows the "Invite tenants" button.
 * - The INVITED status badge shows a tooltip with the last resent timestamp.
 */
export function LeaseTenantsList({
	leaseId,
	isDraft,
	isReview = false,
}: LeaseTenantListProps) {
	const inviteDialog = useDialogState()
	const { data: tenants = [], isLoading } = useLeaseTenants(leaseId)

	const hasActions =
		isDraft || isReview || tenants.some((t) => t.status === 'INVITED')
	const totalCols = hasActions ? TABLE_COLS_WITH_ACTIONS : TABLE_COLS_BASE

	const tableContent = (
		<SectionCard
			title="Tenants"
			className="overflow-hidden"
			actions={
				isDraft && (
					<Button variant="outline" size="sm" onClick={inviteDialog.open}>
						<UserPlus className="size-4" />
						Invite tenants
					</Button>
				)
			}
		>
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
									{tenant.status === 'INVITED' ? (
										<InviteStatusBadge
											status="PENDING"
											lastResentAt={tenant.lastResentAt}
											expiresAt={tenant.expiresAt}
											emailStatus={tenant.emailStatus}
											emailError={tenant.emailError}
										/>
									) : (
										<Badge
											variant={
												tenant.status === 'SIGNED' ? 'success' : 'secondary'
											}
										>
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
											isReview={isReview}
										/>
									</TableCell>
								)}
							</TableRow>
						))
					)}
				</TableBody>
			</Table>
		</SectionCard>
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
