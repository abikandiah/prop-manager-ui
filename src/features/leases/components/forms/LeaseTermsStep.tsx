import { useFormContext } from 'react-hook-form'
import { Input } from '@abumble/design-system/components/Input'
import { Label } from '@abumble/design-system/components/Label'
import { Select } from '@abumble/design-system/components/Select'
import type { LeaseFormValues } from './LeaseAgreementFormWizard'
import { FieldError } from '@/components/ui/FieldError'
import { RequiredMark } from '@/components/ui'
import { LATE_FEE_TYPES } from '@/domain/lease'
import { formatEnumLabel } from '@/lib/format'

export function LeaseTermsStep() {
	const {
		register,
		watch,
		formState: { errors },
	} = useFormContext<LeaseFormValues>()

	const lateFeeType = watch('lateFeeType')

	return (
		<div className="space-y-4">
			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-2">
					<Label htmlFor="rentAmount">
						Rent amount ($) <RequiredMark />
					</Label>
					<Input
						id="rentAmount"
						{...register('rentAmount')}
						type="number"
						min={0}
						step={0.01}
						placeholder="1500.00"
					/>
					<FieldError message={errors.rentAmount?.message} />
				</div>
				<div className="space-y-2">
					<Label htmlFor="rentDueDay">
						Rent due day <RequiredMark />
					</Label>
					<Input
						id="rentDueDay"
						{...register('rentDueDay')}
						type="number"
						min={1}
						max={31}
						placeholder="1"
					/>
					<FieldError message={errors.rentDueDay?.message} />
				</div>
			</div>

			<div className="space-y-2">
				<Label htmlFor="securityDepositHeld">Security deposit held ($)</Label>
				<Input
					id="securityDepositHeld"
					{...register('securityDepositHeld')}
					type="number"
					min={0}
					step={0.01}
					placeholder="Optional"
				/>
				<FieldError message={errors.securityDepositHeld?.message} />
			</div>

			<div className="rounded-md bg-muted/40 p-3 space-y-3">
				<p className="text-xs font-medium text-muted-foreground">Late fee</p>
				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-2">
						<Label htmlFor="lateFeeType">Type</Label>
						<Select id="lateFeeType" {...register('lateFeeType')}>
							<option value="">None</option>
							{LATE_FEE_TYPES.map((t) => (
								<option key={t} value={t}>
									{formatEnumLabel(t)}
								</option>
							))}
						</Select>
					</div>
					<div className="space-y-2">
						<Label htmlFor="lateFeeAmount">Amount</Label>
						<Input
							id="lateFeeAmount"
							{...register('lateFeeAmount')}
							type="number"
							min={0}
							step={0.01}
							placeholder="Optional"
							disabled={!lateFeeType}
						/>
						<FieldError message={errors.lateFeeAmount?.message} />
					</div>
				</div>
			</div>

			<div className="space-y-2">
				<Label htmlFor="noticePeriodDays">Notice period (days)</Label>
				<Input
					id="noticePeriodDays"
					{...register('noticePeriodDays')}
					type="number"
					min={0}
					placeholder="e.g. 30"
				/>
				<FieldError message={errors.noticePeriodDays?.message} />
			</div>
		</div>
	)
}
