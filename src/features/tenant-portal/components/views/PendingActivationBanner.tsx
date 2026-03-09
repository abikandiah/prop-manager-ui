import { useState } from 'react'
import { toast } from 'sonner'
import type { LeaseStatus } from '@/domain/lease'
import type { LeaseTenantStatus } from '@/domain/lease-tenant'
import type { TenantCoTenantSummary } from '@/domain/tenant-portal'
import { useSignLease } from '@/features/leases'
import { MessageBanner } from '@abumble/design-system/components/Banner'
import { Button } from '@abumble/design-system/components/Button'

const SIMPLE_MESSAGES: Partial<Record<LeaseStatus, string>> = {
	DRAFT:
		"Your lease is being prepared. You'll be notified when it's ready to review.",
	REVIEW:
		'Your lease is under review by management and will be activated soon.',
}

function CheckItem({ done, label }: { done: boolean; label: string }) {
	return (
		<li className="flex items-center gap-2 text-sm">
			<span className={done ? 'text-green-600' : 'text-muted-foreground'}>
				{done ? '✓' : '○'}
			</span>
			<span
				className={
					done ? 'line-through text-muted-foreground' : 'text-foreground'
				}
			>
				{label}
			</span>
		</li>
	)
}

interface Props {
	leaseId: string
	status: LeaseStatus
	coTenants: TenantCoTenantSummary[]
	myLeaseTenantId: string
	myLeaseTenantStatus: LeaseTenantStatus
}

export function PendingActivationBanner({
	leaseId,
	status,
	coTenants,
	myLeaseTenantId,
	myLeaseTenantStatus,
}: Props) {
	const [signed, setSigned] = useState(false)
	const signLease = useSignLease()

	if (status === 'REVIEW' && myLeaseTenantStatus === 'REGISTERED' && !signed) {
		return (
			<div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40 flex flex-col sm:flex-row sm:items-center gap-4">
				<div className="flex-1">
					<p className="text-sm font-medium text-amber-900 dark:text-amber-200">
						Your signature is needed
					</p>
					<p className="text-sm text-amber-800 dark:text-amber-300 mt-0.5">
						Review the lease document below and sign to proceed.
					</p>
				</div>
				<Button
					variant="default"
					disabled={signLease.isPending}
					onClick={() =>
						signLease.mutate(
							{ leaseId, leaseTenantId: myLeaseTenantId },
							{
								onSuccess: () => {
									toast.success('Lease signed!')
									setSigned(true)
								},
							},
						)
					}
				>
					{signLease.isPending ? 'Signing…' : 'Sign lease'}
				</Button>
			</div>
		)
	}

	// Tenant signed but co-tenants haven't yet — lease still in REVIEW
	if (status === 'REVIEW' && myLeaseTenantStatus === 'SIGNED') {
		const unsignedCoTenants = coTenants.filter((ct) => ct.status !== 'SIGNED')
		return (
			<div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/40">
				<p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
					You've signed the lease
				</p>
				<ul className="space-y-1.5">
					{unsignedCoTenants.map((ct) => (
						<CheckItem
							key={ct.name}
							done={false}
							label={`Waiting for ${ct.name} to sign.`}
						/>
					))}
					{unsignedCoTenants.length === 0 && (
						<CheckItem
							done={false}
							label="Waiting for manager to activate your tenancy."
						/>
					)}
				</ul>
			</div>
		)
	}

	if (status === 'SIGNED') {
		const unsignedCoTenants = coTenants.filter((ct) => ct.status !== 'SIGNED')
		return (
			<div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/40">
				<p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-3">
					Your onboarding checklist
				</p>
				<ul className="space-y-1.5">
					<CheckItem done label="You have signed the lease." />
					{unsignedCoTenants.map((ct) => (
						<CheckItem
							key={ct.name}
							done={false}
							label={`Waiting for ${ct.name} to sign.`}
						/>
					))}
					<CheckItem
						done={false}
						label="Waiting for manager to activate your tenancy."
					/>
				</ul>
			</div>
		)
	}

	const message = SIMPLE_MESSAGES[status]
	if (!message) return null
	return <MessageBanner type="note" message={message} />
}
