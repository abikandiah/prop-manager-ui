import { Input } from '@abumble/design-system/components/Input'
import { Checkbox } from '@abumble/design-system/components/Checkbox'
import { Label } from '@abumble/design-system/components/Label'
import { Select } from '@abumble/design-system/components/Select'
import type { LateFeeType } from '@/domain/lease'
import { LATE_FEE_TYPES } from '@/domain/lease'

export interface TemplateDetailsStepProps {
	name: string
	versionTag: string
	defaultLateFeeType: LateFeeType | ''
	defaultLateFeeAmount: string
	defaultNoticePeriodDays: string
	active: boolean
	onFieldChange: (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
	) => void
	onActiveChange: (checked: boolean) => void
	isEdit: boolean
}

export function TemplateDetailsStep({
	name,
	versionTag,
	defaultLateFeeType,
	defaultLateFeeAmount,
	defaultNoticePeriodDays,
	active,
	onFieldChange,
	onActiveChange,
	isEdit,
}: TemplateDetailsStepProps) {
	return (
		<div className="space-y-4 pt-4">
			<div className="space-y-2">
				<Label htmlFor="name">
					Template name{' '}
					<span className="text-destructive" aria-hidden>
						*
					</span>
				</Label>
				<Input
					id="name"
					name="name"
					value={name}
					onChange={onFieldChange}
					placeholder="e.g. Ontario Residential Standard 2026"
					maxLength={255}
					required
				/>
			</div>

			<div className="space-y-2">
				<Label htmlFor="versionTag">Version tag (optional)</Label>
				<Input
					id="versionTag"
					name="versionTag"
					value={versionTag}
					onChange={onFieldChange}
					placeholder="e.g. v2.1"
					maxLength={50}
				/>
			</div>

			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-2">
					<Label htmlFor="defaultLateFeeType">Default late fee type</Label>
					<Select
						id="defaultLateFeeType"
						name="defaultLateFeeType"
						value={defaultLateFeeType}
						onChange={onFieldChange}
					>
						<option value="">None</option>
						{LATE_FEE_TYPES.map((type) => (
							<option key={type} value={type}>
								{type.replace(/_/g, ' ')}
							</option>
						))}
					</Select>
				</div>

				<div className="space-y-2">
					<Label htmlFor="defaultLateFeeAmount">Default late fee amount</Label>
					<Input
						id="defaultLateFeeAmount"
						name="defaultLateFeeAmount"
						type="number"
						min={0}
						step={0.01}
						value={defaultLateFeeAmount}
						onChange={onFieldChange}
						placeholder="Optional"
					/>
				</div>
			</div>

			<div className="space-y-2">
				<Label htmlFor="defaultNoticePeriodDays">
					Default notice period (days)
				</Label>
				<Input
					id="defaultNoticePeriodDays"
					name="defaultNoticePeriodDays"
					type="number"
					min={1}
					value={defaultNoticePeriodDays}
					onChange={onFieldChange}
					placeholder="Optional"
				/>
			</div>

			{isEdit && (
				<div className="flex items-center gap-2">
					<Checkbox
						id="active"
						checked={active}
						onCheckedChange={(checked) => onActiveChange(checked === true)}
					/>
					<Label htmlFor="active" className="cursor-pointer font-normal">
						Active (available when creating new leases)
					</Label>
				</div>
			)}
		</div>
	)
}
