import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '@abumble/design-system/components/Button'
import { Input } from '@abumble/design-system/components/Input'
import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { SYSTEM_KEYS, SYSTEM_PARAMETERS } from '../../constants'
import type { TemplateFormValues } from './LeaseTemplateFormWizard'
import { normalizeParameterName, recordsShallowEqual } from '@/lib/util'

/**
 * Internal representation of a custom parameter with a stable ID.
 * The ID is generated once and never changes, even when the user renames the key.
 */
type CustomParam = { id: string; key: string; value: string }

function recordToCustomParams(
	record: Record<string, string>,
): Array<CustomParam> {
	return Object.entries(record)
		.filter(([key]) => !SYSTEM_KEYS.has(key))
		.map(([key, value]) => ({ id: crypto.randomUUID(), key, value }))
}

function customParamsToRecord(
	customParams: Array<CustomParam>,
): Record<string, string> {
	return Object.fromEntries(
		customParams
			.filter((p) => p.key.trim() !== '')
			.map((p) => [p.key, p.value]),
	)
}

const TemplateParametersStepComponent = function TemplateParametersStep() {
	const { watch, setValue } = useFormContext<TemplateFormValues>()
	const templateParameters = watch('templateParameters')

	const [customParams, setCustomParams] = useState<Array<CustomParam>>(() =>
		recordToCustomParams(templateParameters),
	)
	const [systemParamsCollapsed, setSystemParamsCollapsed] = useState(true)

	const templateParametersRef = useRef(templateParameters)
	templateParametersRef.current = templateParameters

	// Sync from form when templateParameters changes externally (e.g. reset/navigation)
	useEffect(() => {
		setCustomParams((prev) => {
			const currentRecord = customParamsToRecord(prev)
			if (recordsShallowEqual(templateParameters, currentRecord)) return prev

			// Preserve existing IDs when syncing from parent
			const newParams: Array<CustomParam> = []
			const usedIds = new Set<string>()

			Object.entries(templateParameters)
				.filter(([key]) => !SYSTEM_KEYS.has(key))
				.forEach(([key, value]) => {
					const existing = prev.find((p) => p.key === key)
					if (existing && !usedIds.has(existing.id)) {
						newParams.push({ id: existing.id, key, value })
						usedIds.add(existing.id)
					} else {
						let newId = crypto.randomUUID()
						while (usedIds.has(newId)) newId = crypto.randomUUID()
						newParams.push({ id: newId, key, value })
						usedIds.add(newId)
					}
				})

			return newParams
		})
	}, [templateParameters])

	const syncToForm = useCallback(
		(params: Array<CustomParam>) => {
			setValue('templateParameters', customParamsToRecord(params))
		},
		[setValue],
	)

	const handleAddParameter = useCallback(() => {
		setCustomParams((prev) => {
			const updated = [...prev, { id: crypto.randomUUID(), key: '', value: '' }]
			syncToForm(updated)
			return updated
		})
	}, [syncToForm])

	const handleRemoveParameter = useCallback(
		(id: string) => {
			setCustomParams((prev) => {
				const updated = prev.filter((p) => p.id !== id)
				syncToForm(updated)
				return updated
			})
		},
		[syncToForm],
	)

	const handleParameterChange = useCallback(
		(id: string, newKey: string, value: string) => {
			setCustomParams((prev) => {
				const param = prev.find((p) => p.id === id)
				if (!param) return prev

				const key = newKey.trim()
				if (key !== '') {
					const duplicate = prev.some(
						(p) => p.id !== id && p.key.trim() === key,
					)
					if (duplicate) {
						toast.error(`Parameter "${key}" already exists`)
						return prev
					}
				}

				const updated = prev.map((p) =>
					p.id === id ? { ...p, key, value } : p,
				)
				syncToForm(updated)
				return updated
			})
		},
		[syncToForm],
	)

	return (
		<div className="space-y-6">
			<div>
				<div className="flex items-center justify-between mb-2">
					<h3 className="text-lg font-semibold text-foreground">
						Custom Parameters
					</h3>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={handleAddParameter}
					>
						<Plus className="h-4 w-4" />
						Add Parameter
					</Button>
				</div>
				<p className="text-sm text-muted-foreground mb-4">
					Add custom parameters with default values. These can be used in your
					template markdown and overridden per lease.
				</p>

				{customParams.length === 0 ? (
					<div className="border border-dashed rounded-lg p-8 text-center">
						<p className="text-sm text-muted-foreground">
							No custom parameters yet. Click "Add Parameter" to create one.
						</p>
					</div>
				) : (
					<div className="border rounded-lg overflow-hidden">
						<table className="w-full">
							<thead className="bg-muted/50">
								<tr>
									<th className="text-left px-4 py-2 text-sm font-medium text-muted-foreground">
										Parameter Name
									</th>
									<th className="text-left px-4 py-2 text-sm font-medium text-muted-foreground">
										Default Value
									</th>
									<th className="w-16"></th>
								</tr>
							</thead>
							<tbody className="divide-y">
								{customParams.map((param) => (
									<CustomParameterRow
										key={param.id}
										param={param}
										onRemove={handleRemoveParameter}
										onChange={handleParameterChange}
									/>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>

			<div>
				<button
					type="button"
					onClick={() => setSystemParamsCollapsed(!systemParamsCollapsed)}
					className="flex items-center gap-2 w-full text-left mb-2 group"
				>
					{systemParamsCollapsed ? (
						<ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
					) : (
						<ChevronDown className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
					)}
					<h3 className="text-lg font-semibold text-foreground group-hover:text-foreground/80 transition-colors">
						System Parameters
					</h3>
				</button>

				{!systemParamsCollapsed && (
					<>
						<p className="text-sm text-muted-foreground mb-4">
							These parameters are automatically filled when creating a lease
							agreement and cannot be modified.
						</p>
						<div className="border rounded-lg overflow-hidden">
							<table className="w-full">
								<thead className="bg-muted/50">
									<tr>
										<th className="text-left px-4 py-2 text-sm font-medium text-muted-foreground">
											Parameter
										</th>
										<th className="text-left px-4 py-2 text-sm font-medium text-muted-foreground">
											Description
										</th>
									</tr>
								</thead>
								<tbody className="divide-y">
									{SYSTEM_PARAMETERS.map((param) => (
										<tr key={param.key} className="hover:bg-muted/30">
											<td className="px-4 py-3 text-sm font-mono text-foreground">
												{`{{${param.key}}}`}
											</td>
											<td className="px-4 py-3 text-sm text-muted-foreground">
												{param.description}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</>
				)}
			</div>
		</div>
	)
}

interface CustomParameterRowProps {
	param: CustomParam
	onRemove: (id: string) => void
	onChange: (id: string, newKey: string, value: string) => void
}

const CustomParameterRow = memo(function CustomParameterRow({
	param,
	onRemove,
	onChange,
}: CustomParameterRowProps) {
	const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newKey = normalizeParameterName(e.target.value)
		onChange(param.id, newKey, param.value)
	}

	const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		onChange(param.id, param.key, e.target.value)
	}

	return (
		<tr className="hover:bg-muted/30">
			<td className="px-4 py-3">
				<div className="relative">
					<span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-sm">
						{'{{'}
					</span>
					<Input
						id={`param-key-${param.id}`}
						value={param.key}
						onChange={handleKeyChange}
						placeholder="parameter_name"
						className="pl-9 pr-9 font-mono text-sm"
					/>
					<span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-sm">
						{'}}'}
					</span>
				</div>
			</td>
			<td className="px-4 py-3">
				<Input
					id={`param-value-${param.id}`}
					value={param.value}
					onChange={handleValueChange}
					placeholder="Enter default value"
					className="text-sm"
				/>
			</td>
			<td className="px-4 py-3">
				<Button
					type="button"
					variant="ghost"
					size="icon"
					onClick={() => onRemove(param.id)}
					className="text-destructive hover:text-destructive"
				>
					<Trash2 className="h-4 w-4" />
					<span className="sr-only">Remove parameter</span>
				</Button>
			</td>
		</tr>
	)
})

export const TemplateParametersStep = memo(TemplateParametersStepComponent)
