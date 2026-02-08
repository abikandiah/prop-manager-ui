import { cn } from '@abumble/design-system/utils'
import type * as React from 'react'

export type FieldRow =
	| {
			label: string
			value: React.ReactNode
			/** Use for multiline content like descriptions (adds align-top + pre-wrap). */
			multiline?: boolean
	  }
	| null
	| undefined
	| false
	| 0
	| ''

export interface FieldsTableProps {
	rows: FieldRow[]
}

export function FieldsTable({ rows }: FieldsTableProps) {
	const visibleRows = rows.filter(
		(r): r is Exclude<FieldRow, null | undefined | false | 0 | ''> => !!r,
	)

	if (visibleRows.length === 0) return null

	return (
		<table className="w-full border-0 text-left">
			<tbody>
				{visibleRows.map((row, i) => (
					<tr key={row.label}>
						<th
							scope="row"
							className={cn(
								'py-1 pr-4 text-sm font-medium text-muted-foreground',
								i === 0 && 'w-[10rem]',
								row.multiline && 'align-top',
							)}
						>
							{row.label}
						</th>
						<td
							className={cn(
								'py-1 text-foreground',
								row.multiline && 'whitespace-pre-wrap',
							)}
						>
							{row.value}
						</td>
					</tr>
				))}
			</tbody>
		</table>
	)
}
