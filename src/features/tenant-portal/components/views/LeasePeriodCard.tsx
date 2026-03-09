import type { TenantLeaseSummary } from '@/domain/tenant-portal'
import { formatDate } from '@/lib/format'
import { SectionCard } from '@/components/ui'

function progressColor(pct: number): string {
	if (pct >= 90) return 'bg-destructive'
	if (pct >= 80) return 'bg-amber-500'
	return 'bg-primary'
}

export function LeasePeriodCard({ lease }: { lease: TenantLeaseSummary }) {
	const start = new Date(lease.startDate).getTime()
	const end = new Date(lease.endDate).getTime()
	const now = Date.now()
	const total = end - start
	const elapsed = Math.max(0, Math.min(now - start, total))
	const pct = total > 0 ? Math.round((elapsed / total) * 100) : 0
	const daysRemaining = Math.max(0, Math.round((end - now) / 86_400_000))

	return (
		<SectionCard title="Lease period" contentClassName="space-y-3">
			<div className="h-2 w-full rounded-full bg-muted overflow-hidden">
				<div
					className={`h-full rounded-full transition-all ${progressColor(pct)}`}
					style={{ width: `${pct}%` }}
				/>
			</div>
			<div className="flex justify-between text-xs text-muted-foreground">
				<span>Started {formatDate(lease.startDate)}</span>
				<span>Ends {formatDate(lease.endDate)}</span>
			</div>
			<p className="text-sm text-foreground">
				<span className="font-semibold">{daysRemaining.toLocaleString()}</span>{' '}
				days remaining
			</p>
			{lease.noticeDeadlineDate && (
				<p className="text-sm text-muted-foreground">
					Give notice by{' '}
					<span className="font-medium text-foreground">
						{formatDate(lease.noticeDeadlineDate)}
					</span>{' '}
					to avoid automatic renewal.
				</p>
			)}
		</SectionCard>
	)
}
