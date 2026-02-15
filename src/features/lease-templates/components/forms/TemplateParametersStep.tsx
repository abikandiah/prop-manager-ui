import { Button } from '@abumble/design-system/components/Button'
import { Input } from '@abumble/design-system/components/Input'
import { Label } from '@abumble/design-system/components/Label'
import { Trash2, Plus } from 'lucide-react'

const SYSTEM_PARAMETERS = [
	{ key: 'property_name', description: "Property's legal name" },
	{ key: 'unit_number', description: 'Unit number' },
	{ key: 'start_date', description: 'Lease start date' },
	{ key: 'end_date', description: 'Lease end date' },
	{ key: 'rent_amount', description: 'Monthly rent amount' },
	{ key: 'rent_due_day', description: 'Day of month rent is due' },
	{ key: 'security_deposit', description: 'Security deposit amount' },
] as const

export interface TemplateParametersStepProps {
	templateParameters: Record<string, string>
	onParametersChange: (parameters: Record<string, string>) => void
}

export function TemplateParametersStep({
	templateParameters,
	onParametersChange,
}: TemplateParametersStepProps) {
	const customParameters = Object.entries(templateParameters).filter(
		([key]) => !SYSTEM_PARAMETERS.some((sp) => sp.key === key),
	)

	const handleAddParameter = () => {
		const newKey = `param_${Date.now()}`
		onParametersChange({
			...templateParameters,
			[newKey]: '',
		})
	}

	const handleRemoveParameter = (key: string) => {
		const updated = { ...templateParameters }
		delete updated[key]
		onParametersChange(updated)
	}

	const handleParameterChange = (
		oldKey: string,
		newKey: string,
		value: string,
	) => {
		const updated = { ...templateParameters }

		// If key changed, remove old key
		if (oldKey !== newKey) {
			delete updated[oldKey]
		}

		// Set new key/value
		updated[newKey] = value
		onParametersChange(updated)
	}

	return (
		<div className="space-y-6">
			{/* System Parameters (Read-only) */}
			<div>
				<h3 className="text-lg font-semibold text-foreground mb-2">
					System Parameters
				</h3>
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
			</div>

			{/* Custom Parameters */}
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

				{customParameters.length === 0 ? (
					<div className="border border-dashed rounded-lg p-8 text-center">
						<p className="text-sm text-muted-foreground">
							No custom parameters yet. Click "Add Parameter" to create one.
						</p>
					</div>
				) : (
					<div className="space-y-3">
						{customParameters.map(([key, value]) => (
							<CustomParameterRow
								key={key}
								paramKey={key}
								value={value}
								onRemove={() => handleRemoveParameter(key)}
								onChange={(newKey, newValue) =>
									handleParameterChange(key, newKey, newValue)
								}
							/>
						))}
					</div>
				)}
			</div>
		</div>
	)
}

interface CustomParameterRowProps {
	paramKey: string
	value: string
	onRemove: () => void
	onChange: (key: string, value: string) => void
}

function CustomParameterRow({
	paramKey,
	value,
	onRemove,
	onChange,
}: CustomParameterRowProps) {
	const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		let newKey = e.target.value
		// Remove any {{ }} wrapper if user types it
		newKey = newKey.replace(/^\{\{|\}\}$/g, '').trim()
		// Replace spaces with underscores, allow only alphanumeric and underscores
		newKey = newKey.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')
		onChange(newKey, value)
	}

	const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		onChange(paramKey, e.target.value)
	}

	return (
		<div className="flex gap-3 items-start">
			<div className="flex-1 grid grid-cols-2 gap-3">
				<div className="space-y-1">
					<Label htmlFor={`param-key-${paramKey}`} className="text-sm">
						Parameter Name
					</Label>
					<div className="relative">
						<span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-sm">
							{'{{'}
						</span>
						<Input
							id={`param-key-${paramKey}`}
							value={paramKey}
							onChange={handleKeyChange}
							placeholder="parameter_name"
							className="pl-9 pr-9 font-mono"
						/>
						<span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-sm">
							{'}}'}
						</span>
					</div>
				</div>
				<div className="space-y-1">
					<Label htmlFor={`param-value-${paramKey}`} className="text-sm">
						Default Value
					</Label>
					<Input
						id={`param-value-${paramKey}`}
						value={value}
						onChange={handleValueChange}
						placeholder="Enter default value"
					/>
				</div>
			</div>
			<div className="pt-7">
				<Button
					type="button"
					variant="ghost"
					size="icon"
					onClick={onRemove}
					className="text-destructive hover:text-destructive"
				>
					<Trash2 className="h-4 w-4" />
					<span className="sr-only">Remove parameter</span>
				</Button>
			</div>
		</div>
	)
}
