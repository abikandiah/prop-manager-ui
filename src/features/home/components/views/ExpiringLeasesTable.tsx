import { Link } from '@tanstack/react-router'
import { Skeleton } from '@abumble/design-system/components/Skeleton'
import { SectionCard } from '@/components/ui/SectionCard'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@abumble/design-system/components/Table'
import { Button } from '@abumble/design-system/components/Button'
import { formatDate } from '@/lib/format'
import type { ExpiringLease } from '../../hooks'

interface ExpiringLeasesTableProps {
	leases: ExpiringLease[]
	isLoading?: boolean
}

export function ExpiringLeasesTable({
	leases,
	isLoading,
}: ExpiringLeasesTableProps) {
	return (
		<SectionCard
			title="Leases Expiring Soon"
			className="overflow-hidden"
			contentClassName="px-0 pb-0"
		>
			{isLoading ? (
				<Table className="[&_td:first-child]:pl-5 [&_th:first-child]:pl-5 [&_td:last-child]:pr-5 [&_th:last-child]:pr-5">
					<TableHeader>
						<TableRow>
							<TableHead>Unit</TableHead>
							<TableHead>End Date</TableHead>
							<TableHead>Days Left</TableHead>
							<TableHead />
						</TableRow>
					</TableHeader>
					<TableBody>
						{Array.from({ length: 3 }).map((_, i) => (
							<TableRow key={i}>
								<TableCell>
									<Skeleton className="h-4 w-16" />
								</TableCell>
								<TableCell>
									<Skeleton className="h-4 w-24" />
								</TableCell>
								<TableCell>
									<Skeleton className="h-4 w-12" />
								</TableCell>
								<TableCell />
							</TableRow>
						))}
					</TableBody>
				</Table>
			) : leases.length === 0 ? (
				<p className="text-sm text-muted-foreground">
					No leases expiring in the next 60 days.
				</p>
			) : (
				<Table className="[&_td:first-child]:pl-5 [&_th:first-child]:pl-5 [&_td:last-child]:pr-5 [&_th:last-child]:pr-5">
					<TableHeader>
						<TableRow>
							<TableHead>Unit</TableHead>
							<TableHead>End Date</TableHead>
							<TableHead>Days Left</TableHead>
							<TableHead />
						</TableRow>
					</TableHeader>
					<TableBody>
						{leases.map((lease) => (
							<TableRow key={lease.id}>
								<TableCell className="font-medium">
									{lease.unitNumber}
								</TableCell>
								<TableCell>{formatDate(lease.endDate)}</TableCell>
								<TableCell>
									<span
										className={
											lease.daysRemaining <= 14
												? 'font-medium text-destructive'
												: lease.daysRemaining <= 30
													? 'font-medium text-yellow-500'
													: 'text-muted-foreground'
										}
									>
										{lease.daysRemaining}d
									</span>
								</TableCell>
								<TableCell>
									<Button variant="ghost" size="sm" asChild>
										<Link
											to="/leases/agreements/$leaseId"
											params={{ leaseId: lease.id }}
										>
											Go to Lease
										</Link>
									</Button>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			)}
		</SectionCard>
	)
}
