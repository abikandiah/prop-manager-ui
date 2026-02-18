import { Controller, useFormContext } from 'react-hook-form'
import { Input } from '@abumble/design-system/components/Input'
import { Checkbox } from '@abumble/design-system/components/Checkbox'
import { Label } from '@abumble/design-system/components/Label'
import { Select } from '@abumble/design-system/components/Select'
import type { TemplateFormValues } from './LeaseTemplateFormWizard'
import { FieldError } from '@/components/ui/FieldError'
import { LATE_FEE_TYPES } from '@/domain/lease'
import { formatEnumLabel } from '@/lib/format'

export interface TemplateDetailsStepProps {
	isEdit: boolean
}

export function TemplateDetailsStep({ isEdit }: TemplateDetailsStepProps) {
	const {
		register,
		control,
		formState: { errors },
	} = useFormContext<TemplateFormValues>()

	return (
		<div className="space-y-4">
			<div className="space-y-2">
				<Label htmlFor="name">
					Template name{' '}
					<span className="text-destructive" aria-hidden>
						*
					</span>
				</Label>
				<Input
					id="name"
					{...register('name')}
					placeholder="e.g. Ontario Residential Standard 2026"
					maxLength={255}
				/>
				<FieldError message={errors.name?.message} />
			</div>

			<div className="space-y-2">
				<Label htmlFor="versionTag">Version tag (optional)</Label>
				<Input
					id="versionTag"
					{...register('versionTag')}
					placeholder="e.g. v2.1"
					maxLength={50}
				/>
			</div>

			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-2">
					<Label htmlFor="defaultLateFeeType">Default late fee type</Label>
					<Select id="defaultLateFeeType" {...register('defaultLateFeeType')}>
						<option value="">None</option>
						{LATE_FEE_TYPES.map((type) => (
							<option key={type} value={type}>
								{formatEnumLabel(type)}
							</option>
						))}
					</Select>
				</div>

				<div className="space-y-2">
					<Label htmlFor="defaultLateFeeAmount">Default late fee amount</Label>
					<Input
						id="defaultLateFeeAmount"
						{...register('defaultLateFeeAmount')}
						type="number"
						min={0}
						step={0.01}
						placeholder="Optional"
					/>
					<FieldError message={errors.defaultLateFeeAmount?.message} />
				</div>
			</div>

			<div className="space-y-2">
				<Label htmlFor="defaultNoticePeriodDays">
					Default notice period (days)
				</Label>
				<Input
					id="defaultNoticePeriodDays"
					{...register('defaultNoticePeriodDays')}
					type="number"
					min={1}
					placeholder="Optional"
				/>
				<FieldError message={errors.defaultNoticePeriodDays?.message} />
			</div>

			{isEdit && (
				<Controller
					name="active"
					control={control}
					render={({ field }) => (
						<div className="flex items-center gap-2 pt-2">
							<Checkbox
								id="active"
								checked={field.value}
								onCheckedChange={(checked) => field.onChange(checked === true)}
							/>
							<Label htmlFor="active" className="cursor-pointer font-normal">
								Active (available when creating new leases)
							</Label>
						</div>
					)}
				/>
			)}
		</div>
	)
}
