import { Input } from '@abumble/design-system/components/Input'
import { Label } from '@abumble/design-system/components/Label'
import { Select } from '@abumble/design-system/components/Select'
import type { LateFeeType } from '@/domain/lease'
import { LATE_FEE_TYPES } from '@/domain/lease'

interface LeaseTermsStepProps {
	rentAmount: string
	rentDueDay: string
	securityDepositHeld: string
	lateFeeType: LateFeeType | ''
	lateFeeAmount: string
	noticePeriodDays: string
	onFieldChange: (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
	) => void
}

export function LeaseTermsStep({
	rentAmount,
	rentDueDay,
	securityDepositHeld,
	lateFeeType,
	lateFeeAmount,
	noticePeriodDays,
	onFieldChange,
}: LeaseTermsStepProps) {
	return (
		<div className="space-y-4">
			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-2">
					<Label htmlFor="rentAmount">
						Rent amount ($){' '}
						<span className="text-destructive" aria-hidden>
							*
						</span>
					</Label>
					<Input
						id="rentAmount"
						name="rentAmount"
						type="number"
						min={0}
						step={0.01}
						value={rentAmount}
						onChange={onFieldChange}
						placeholder="1500.00"
						required
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="rentDueDay">
						Rent due day{' '}
						<span className="text-destructive" aria-hidden>
							*
						</span>
					</Label>
					<Input
						id="rentDueDay"
						name="rentDueDay"
						type="number"
						min={1}
						max={31}
						value={rentDueDay}
						onChange={onFieldChange}
						placeholder="1"
						required
					/>
				</div>
			</div>

			<div className="space-y-2">
				<Label htmlFor="securityDepositHeld">Security deposit held ($)</Label>
				<Input
					id="securityDepositHeld"
					name="securityDepositHeld"
					type="number"
					min={0}
					step={0.01}
					value={securityDepositHeld}
					onChange={onFieldChange}
					placeholder="Optional"
				/>
			</div>

			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-2">
					<Label htmlFor="lateFeeType">Late fee type</Label>
					<Select
						id="lateFeeType"
						name="lateFeeType"
						value={lateFeeType}
						onChange={onFieldChange}
					>
						<option value="">None</option>
						{LATE_FEE_TYPES.map((t) => (
							<option key={t} value={t}>
								{t.replace(/_/g, ' ')}
							</option>
						))}
					</Select>
				</div>
				<div className="space-y-2">
					<Label htmlFor="lateFeeAmount">Late fee amount</Label>
					<Input
						id="lateFeeAmount"
						name="lateFeeAmount"
						type="number"
						min={0}
						step={0.01}
						value={lateFeeAmount}
						onChange={onFieldChange}
						placeholder="Optional"
						disabled={!lateFeeType}
					/>
				</div>
			</div>

			<div className="space-y-2">
				<Label htmlFor="noticePeriodDays">Notice period (days)</Label>
				<Input
					id="noticePeriodDays"
					name="noticePeriodDays"
					type="number"
					min={0}
					value={noticePeriodDays}
					onChange={onFieldChange}
					placeholder="e.g. 30"
				/>
			</div>
		</div>
	)
}
