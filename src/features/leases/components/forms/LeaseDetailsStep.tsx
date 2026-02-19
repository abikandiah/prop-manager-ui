import { Controller, useFormContext } from 'react-hook-form'
import { Input } from '@abumble/design-system/components/Input'
import { Label } from '@abumble/design-system/components/Label'
import { Select } from '@abumble/design-system/components/Select'
import type { LeaseFormValues } from './LeaseAgreementFormWizard'
import { FieldError } from '@/components/ui/FieldError'
import { RequiredMark } from '@/components/ui'
import { usePropsList } from '@/features/props'
import { useUnitsList } from '@/features/units'
import { useLeaseTemplatesActive } from '@/features/lease-templates'

export function LeaseDetailsStep() {
	const {
		register,
		watch,
		control,
		setValue,
		formState: { errors },
	} = useFormContext<LeaseFormValues>()

	const { data: propsList } = usePropsList()
	const { data: unitsList } = useUnitsList()
	const { data: activeTemplates } = useLeaseTemplatesActive()

	const propertyId = watch('propertyId')

	return (
		<div className="space-y-4">
			<div className="space-y-2">
				<Label htmlFor="leaseTemplateId">
					Template <RequiredMark />
				</Label>
				<Select id="leaseTemplateId" {...register('leaseTemplateId')}>
					<option value="" disabled>
						Select a template
					</option>
					{activeTemplates?.map((t) => (
						<option key={t.id} value={t.id}>
							{t.name}
							{t.versionTag ? ` (${t.versionTag})` : ''}
						</option>
					))}
				</Select>
				<FieldError message={errors.leaseTemplateId?.message} />
			</div>

			<div className="space-y-2">
				<Label htmlFor="propertyId">
					Property <RequiredMark />
				</Label>
				<Controller
					name="propertyId"
					control={control}
					render={({ field }) => (
						<Select
							id="propertyId"
							value={field.value}
							onChange={(e) => {
								field.onChange(e.target.value)
								// Clear dependent unit when property changes
								setValue('unitId', '')
							}}
						>
							<option value="" disabled>
								Select a property
							</option>
							{propsList?.map((p) => (
								<option key={p.id} value={p.id}>
									{p.legalName}
								</option>
							))}
						</Select>
					)}
				/>
				<FieldError message={errors.propertyId?.message} />
			</div>

			<div className="space-y-2">
				<Label htmlFor="unitId">
					Unit <RequiredMark />
				</Label>
				<Select id="unitId" {...register('unitId')}>
					<option value="" disabled>
						Select a unit
					</option>
					{unitsList
						?.filter((u) => !propertyId || u.propertyId === propertyId)
						.map((u) => (
							<option key={u.id} value={u.id}>
								{u.unitNumber}
							</option>
						))}
				</Select>
				<FieldError message={errors.unitId?.message} />
			</div>

			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-2">
					<Label htmlFor="startDate">
						Start date <RequiredMark />
					</Label>
					<Input id="startDate" {...register('startDate')} type="date" />
					<FieldError message={errors.startDate?.message} />
				</div>
				<div className="space-y-2">
					<Label htmlFor="endDate">
						End date <RequiredMark />
					</Label>
					<Input id="endDate" {...register('endDate')} type="date" />
					<FieldError message={errors.endDate?.message} />
				</div>
			</div>
		</div>
	)
}
