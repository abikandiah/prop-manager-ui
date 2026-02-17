import { Skeleton } from '@abumble/design-system/components/Skeleton'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@abumble/design-system/components/Table'

export interface TableSkeletonProps {
	/** Header labels for each column. Empty string renders a blank header (e.g. for action columns). */
	headers: string[]
	/**
	 * Tailwind width class for each column's skeleton (e.g. "w-24").
	 * Use empty string to render a blank cell (e.g. for action columns).
	 * Must match length of `headers`.
	 */
	columnWidths: string[]
	rows?: number
}

/**
 * Standalone skeleton table used as a loading fallback in table views.
 * Renders the full table container with header and skeleton rows.
 */
export function TableSkeleton({
	headers,
	columnWidths,
	rows = 3,
}: TableSkeletonProps) {
	return (
		<div className="rounded border bg-card overflow-hidden">
			<Table>
				<TableHeader>
					<TableRow>
						{headers.map((header, i) => (
							<TableHead key={i} className={!header ? 'w-12' : undefined}>
								{header}
							</TableHead>
						))}
					</TableRow>
				</TableHeader>
				<TableBody>
					{Array.from({ length: rows }).map((_, i) => (
						<TableRow key={i}>
							{columnWidths.map((width, j) => (
								<TableCell key={j}>
									{width ? <Skeleton className={`h-6 ${width}`} /> : null}
								</TableCell>
							))}
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	)
}
