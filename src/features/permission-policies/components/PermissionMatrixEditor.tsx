import { cn } from '@abumble/design-system/utils'
import { Checkbox } from '@abumble/design-system/components/Checkbox'
import { normalizePermString } from '@/lib/util'

const DOMAINS = [
	{ key: 'o', label: 'Organization' },
	{ key: 'p', label: 'Portfolio' },
	{ key: 'l', label: 'Leases' },
	{ key: 'c', label: 'People' },
] as const

const ACTIONS = [
	{ key: 'r', label: 'Read', short: 'R' },
	{ key: 'c', label: 'Create', short: 'C' },
	{ key: 'u', label: 'Update', short: 'U' },
	{ key: 'd', label: 'Delete', short: 'D' },
] as const

export interface PermissionMatrixEditorProps {
	/** Custom/Explicit permissions (the value being edited). */
	value: Record<string, string>
	onChange?: (value: Record<string, string>) => void
	/** When true, all checkboxes are disabled and the grid is display-only. */
	readOnly?: boolean
}

/**
 * Renders a 4×6 grid of checkboxes for editing or previewing domain/action permissions.
 * `value` is a map of domain key → action letters (e.g. { l: 'rcud', m: 'r' }).
 * Clicking a domain label toggles all actions for that row.
 */
export function PermissionMatrixEditor({
	value,
	onChange,
	readOnly = false,
}: PermissionMatrixEditorProps) {
	const handleToggle = (
		domainKey: string,
		actionKey: string,
		checked: boolean,
	) => {
		if (readOnly || !onChange) return

		const current = value[domainKey] ?? ''
		const updated = normalizePermString(
			checked
				? current.includes(actionKey)
					? current
					: current + actionKey
				: current.replace(actionKey, ''),
		)

		const next = { ...value }
		if (updated) {
			next[domainKey] = updated
		} else {
			delete next[domainKey]
		}
		onChange(next)
	}

	const handleToggleAll = (domainKey: string) => {
		if (readOnly || !onChange) return

		const allChecked = ACTIONS.every((a) =>
			(value[domainKey] ?? '').includes(a.key),
		)
		const next = { ...value }
		if (allChecked) {
			delete next[domainKey]
		} else {
			next[domainKey] = normalizePermString(ACTIONS.map((a) => a.key).join(''))
		}
		onChange(next)
	}

	return (
		<div
			className={cn(
				'rounded border overflow-hidden text-sm',
				readOnly && 'opacity-75',
			)}
		>
			<table className="w-full">
				<thead>
					<tr className="bg-muted/50">
						<th className="text-left px-3 py-2 font-medium text-muted-foreground">
							Domain
						</th>
						{ACTIONS.map((a) => (
							<th
								key={a.key}
								className="px-2 py-2 text-center font-medium text-muted-foreground w-10"
							>
								<abbr title={a.label} className="no-underline cursor-default">
									{a.short}
								</abbr>
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{DOMAINS.map((domain, i) => (
						<tr
							key={domain.key}
							className={cn(
								i % 2 === 0 ? 'bg-background' : 'bg-muted/20',
								'border-t',
							)}
						>
							<td className="px-3 py-2">
								<button
									type="button"
									disabled={readOnly}
									onClick={() => handleToggleAll(domain.key)}
									title="Toggle all"
									className={cn(
										'font-medium text-left w-full',
										!readOnly &&
											'cursor-pointer hover:text-foreground transition-colors',
									)}
								>
									{domain.label}
								</button>
							</td>
							{ACTIONS.map((action) => {
								const isChecked = (value[domain.key] ?? '').includes(action.key)

								return (
									<td key={action.key} className="px-2 py-2 text-center">
										<Checkbox
											checked={isChecked}
											onCheckedChange={(c) =>
												handleToggle(domain.key, action.key, c === true)
											}
											disabled={readOnly}
											aria-label={`${domain.label} ${action.label}`}
										/>
									</td>
								)
							})}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	)
}
