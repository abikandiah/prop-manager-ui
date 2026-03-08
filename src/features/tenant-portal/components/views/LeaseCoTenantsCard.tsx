import type { TenantCoTenantSummary } from '@/domain/tenant-portal'
import { LeaseTenantStatus } from '@/domain/lease-tenant'
import { formatEnumLabel } from '@/lib/format'
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '@abumble/design-system/components/Card'

const STATUS_LABELS: Record<string, string | undefined> = {
	[LeaseTenantStatus.INVITED]: 'Invited — not yet signed',
	[LeaseTenantStatus.REGISTERED]: 'Registered — not yet signed',
}

function CoTenantRow({ coTenant }: { coTenant: TenantCoTenantSummary }) {
	const statusLabel = STATUS_LABELS[coTenant.status]
	return (
		<div className="flex items-start justify-between gap-2 py-2.5 border-b last:border-0">
			<div className="min-w-0">
				<p className="text-sm font-medium text-foreground truncate">
					{coTenant.name}
				</p>
				{statusLabel && (
					<p className="text-xs text-muted-foreground">{statusLabel}</p>
				)}
			</div>
			<span className="shrink-0 text-xs font-medium text-muted-foreground">
				{formatEnumLabel(coTenant.role)}
			</span>
		</div>
	)
}

export function LeaseCoTenantsCard({
	coTenants,
}: {
	coTenants: TenantCoTenantSummary[]
}) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base">Co-tenants</CardTitle>
			</CardHeader>
			<CardContent>
				{coTenants.length === 0 ? (
					<p className="text-sm text-muted-foreground py-2">
						You're the only tenant on this lease.
					</p>
				) : (
					coTenants.map((ct, i) => <CoTenantRow key={i} coTenant={ct} />)
				)}
			</CardContent>
		</Card>
	)
}
