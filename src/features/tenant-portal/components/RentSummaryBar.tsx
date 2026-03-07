import type { TenantLeaseSummary } from '@/domain/tenant-portal'
import { formatCurrency } from '@/lib/format'

function Stat({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex flex-col gap-0.5 min-w-0">
			<span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
			<span className="text-xl font-bold text-foreground">{value}</span>
		</div>
	)
}

export function RentSummaryBar({ lease }: { lease: TenantLeaseSummary }) {
	const dueDay = lease.rentDueDay === 1 ? '1st' :
		lease.rentDueDay === 2 ? '2nd' :
		lease.rentDueDay === 3 ? '3rd' :
		`${lease.rentDueDay}th`

	return (
		<div className="flex flex-wrap gap-6 rounded-lg bg-muted px-6 py-4 border">
			<Stat label="Monthly rent" value={`${formatCurrency(lease.rentAmount)} / month`} />
			<Stat label="Due" value={`On the ${dueDay}`} />
			{lease.securityDepositHeld != null && (
				<Stat label="Deposit held" value={formatCurrency(lease.securityDepositHeld)} />
			)}
		</div>
	)
}
