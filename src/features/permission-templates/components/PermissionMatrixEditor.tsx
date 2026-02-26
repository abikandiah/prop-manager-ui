import { cn } from '@abumble/design-system/utils'
import { Checkbox } from '@abumble/design-system/components/Checkbox'

const DOMAINS = [
	{ key: 'o', label: 'Organization' },
	{ key: 'p', label: 'Portfolio' },
	{ key: 'l', label: 'Leases' },
	{ key: 'm', label: 'Maintenance' },
	{ key: 'f', label: 'Finances' },
	{ key: 't', label: 'Tenants' },
] as const

const ACTIONS = [
	{ key: 'r', label: 'Read' },
	{ key: 'c', label: 'Create' },
	{ key: 'u', label: 'Update' },
	{ key: 'd', label: 'Delete' },
] as const

export interface PermissionMatrixEditorProps {
	value: Record<string, string>
	onChange?: (value: Record<string, string>) => void
	/** When true, all checkboxes are disabled and the grid is display-only. */
	readOnly?: boolean
}

/**
 * Renders a 4×4 grid of checkboxes for editing or previewing domain/action permissions.
 * `value` is a map of domain key → action letters (e.g. { l: 'rcud', m: 'r' }).
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
		const updated = checked
			? current.includes(actionKey)
				? current
				: current + actionKey
			: current.replace(actionKey, '')
		const next = { ...value }
		if (updated) {
			next[domainKey] = updated
		} else {
			delete next[domainKey]
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
								className="px-3 py-2 text-center font-medium text-muted-foreground w-20"
							>
								{a.label}
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
							<td className="px-3 py-2 font-medium">{domain.label}</td>
							{ACTIONS.map((action) => {
								const checked = (value[domain.key] ?? '').includes(action.key)
								return (
									<td key={action.key} className="px-3 py-2 text-center">
										<Checkbox
											checked={checked}
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
