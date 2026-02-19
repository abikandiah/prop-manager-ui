import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@abumble/design-system/components/Button'
import { Input } from '@abumble/design-system/components/Input'
import { Checkbox } from '@abumble/design-system/components/Checkbox'
import { DialogFooter } from '@abumble/design-system/components/Dialog'
import { Label } from '@abumble/design-system/components/Label'
import { Select } from '@abumble/design-system/components/Select'
import type { CreateUnitPayload, Unit, UpdateUnitPayload } from '@/domain/unit'
import { FieldError } from '@/components/ui/FieldError'
import { UNIT_STATUSES, UNIT_TYPES, UnitStatus, UnitType } from '@/domain/unit'
import { useCreateUnit, useUpdateUnit } from '@/features/units/hooks'
import { usePropsList } from '@/features/props'
import { formatEnumLabel } from '@/lib/format'
import { generateId } from '@/lib/util'

const optionalFloat = z
	.string()
	.refine(
		(s) => s.trim() === '' || (!isNaN(parseFloat(s)) && parseFloat(s) >= 0),
		'Must be a valid number',
	)

const optionalInt = z
	.string()
	.refine(
		(s) => s.trim() === '' || (!isNaN(parseInt(s, 10)) && parseInt(s, 10) >= 0),
		'Must be a whole number',
	)

const unitFormSchema = z.object({
	propertyId: z.string().min(1, 'Property is required'),
	unitNumber: z
		.string()
		.min(1, 'Unit number is required')
		.max(64, 'Unit number is too long'),
	unitType: z.nativeEnum(UnitType).or(z.literal('')),
	status: z.nativeEnum(UnitStatus),
	description: z.string().max(2000).optional(),
	rentAmount: optionalFloat,
	securityDeposit: optionalFloat,
	bedrooms: optionalInt,
	bathrooms: z
		.string()
		.refine(
			(s) => s.trim() === '' || (!isNaN(parseFloat(s)) && parseFloat(s) >= 0),
			'Must be a valid number',
		),
	squareFootage: optionalInt,
	balcony: z.boolean(),
	laundryInUnit: z.boolean(),
	hardwoodFloors: z.boolean(),
})

type UnitFormValues = z.infer<typeof unitFormSchema>

function makeDefaults(propId?: string): UnitFormValues {
	return {
		propertyId: propId ?? '',
		unitNumber: '',
		unitType: '',
		status: UnitStatus.VACANT,
		description: '',
		rentAmount: '',
		securityDeposit: '',
		bedrooms: '',
		bathrooms: '',
		squareFootage: '',
		balcony: false,
		laundryInUnit: false,
		hardwoodFloors: false,
	}
}

function unitToFormValues(unit: Unit): UnitFormValues {
	return {
		propertyId: unit.propertyId,
		unitNumber: unit.unitNumber,
		unitType: unit.unitType ?? '',
		status: unit.status,
		description: unit.description ?? '',
		rentAmount: unit.rentAmount != null ? String(unit.rentAmount) : '',
		securityDeposit:
			unit.securityDeposit != null ? String(unit.securityDeposit) : '',
		bedrooms: unit.bedrooms != null ? String(unit.bedrooms) : '',
		bathrooms: unit.bathrooms != null ? String(unit.bathrooms) : '',
		squareFootage: unit.squareFootage != null ? String(unit.squareFootage) : '',
		balcony: unit.balcony ?? false,
		laundryInUnit: unit.laundryInUnit ?? false,
		hardwoodFloors: unit.hardwoodFloors ?? false,
	}
}

export interface UnitFormProps {
	propId?: string
	initialUnit?: Unit | null
	onSuccess?: () => void
	onCancel?: () => void
	submitLabel?: string
}

export function UnitForm({
	propId,
	initialUnit = null,
	onSuccess,
	onCancel,
	submitLabel = 'Create Unit',
}: UnitFormProps) {
	const isEdit = initialUnit != null
	const createUnit = useCreateUnit()
	const updateUnit = useUpdateUnit()
	const { data: propsList } = usePropsList()

	const {
		register,
		handleSubmit,
		reset,
		control,
		formState: { errors },
	} = useForm<UnitFormValues>({
		resolver: standardSchemaResolver(unitFormSchema),
		defaultValues: initialUnit
			? unitToFormValues(initialUnit)
			: makeDefaults(propId),
	})

	useEffect(() => {
		reset(initialUnit ? unitToFormValues(initialUnit) : makeDefaults(propId))
	}, [initialUnit?.id, propId, reset])

	const pending = createUnit.isPending || updateUnit.isPending

	const buildCreatePayload = (values: UnitFormValues): CreateUnitPayload => ({
		id: generateId(),
		propertyId: values.propertyId,
		unitNumber: values.unitNumber.trim(),
		unitType: values.unitType || undefined,
		status: values.status,
		description: values.description?.trim() || undefined,
		rentAmount: values.rentAmount.trim()
			? parseFloat(values.rentAmount)
			: undefined,
		securityDeposit: values.securityDeposit.trim()
			? parseFloat(values.securityDeposit)
			: undefined,
		bedrooms: values.bedrooms.trim()
			? parseInt(values.bedrooms, 10)
			: undefined,
		bathrooms: values.bathrooms.trim()
			? parseFloat(values.bathrooms)
			: undefined,
		squareFootage: values.squareFootage.trim()
			? parseInt(values.squareFootage, 10)
			: undefined,
		balcony: values.balcony ? true : undefined,
		laundryInUnit: values.laundryInUnit ? true : undefined,
		hardwoodFloors: values.hardwoodFloors ? true : undefined,
	})

	const buildUpdatePayload = (values: UnitFormValues): UpdateUnitPayload => ({
		propertyId: values.propertyId,
		unitNumber: values.unitNumber.trim(),
		unitType: values.unitType || null,
		status: values.status,
		description: values.description?.trim() || null,
		rentAmount: values.rentAmount.trim() ? parseFloat(values.rentAmount) : null,
		securityDeposit: values.securityDeposit.trim()
			? parseFloat(values.securityDeposit)
			: null,
		bedrooms: values.bedrooms.trim() ? parseInt(values.bedrooms, 10) : null,
		bathrooms: values.bathrooms.trim() ? parseFloat(values.bathrooms) : null,
		squareFootage: values.squareFootage.trim()
			? parseInt(values.squareFootage, 10)
			: null,
		balcony: values.balcony,
		laundryInUnit: values.laundryInUnit,
		hardwoodFloors: values.hardwoodFloors,
		version: initialUnit?.version ?? 0,
	})

	const onSubmit = (values: UnitFormValues) => {
		if (isEdit) {
			updateUnit.mutate(
				{ id: initialUnit.id, payload: buildUpdatePayload(values) },
				{
					onSuccess: () => {
						toast.success('Unit updated')
						onSuccess?.()
					},
				},
			)
		} else {
			createUnit.mutate(buildCreatePayload(values), {
				onSuccess: () => {
					toast.success('Unit created')
					reset(makeDefaults(propId))
					onSuccess?.()
				},
			})
		}
	}

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
			{!propId && (
				<div className="space-y-2">
					<Label htmlFor="propertyId">
						Property{' '}
						<span className="text-destructive" aria-hidden>
							*
						</span>
					</Label>
					<Select id="propertyId" {...register('propertyId')}>
						<option value="" disabled>
							Select a property
						</option>
						{propsList?.map((p) => (
							<option key={p.id} value={p.id}>
								{p.legalName}
							</option>
						))}
					</Select>
					<FieldError message={errors.propertyId?.message} />
				</div>
			)}
			<div className="space-y-2">
				<Label htmlFor="unitNumber">
					Unit number{' '}
					<span className="text-destructive" aria-hidden>
						*
					</span>
				</Label>
				<Input
					id="unitNumber"
					{...register('unitNumber')}
					placeholder="e.g. 101"
					maxLength={64}
				/>
				<FieldError message={errors.unitNumber?.message} />
			</div>
			<div className="space-y-2">
				<Label htmlFor="status">Status</Label>
				<Select id="status" {...register('status')}>
					{UNIT_STATUSES.map((s) => (
						<option key={s} value={s}>
							{formatEnumLabel(s)}
						</option>
					))}
				</Select>
			</div>
			<div className="space-y-2">
				<Label htmlFor="unitType">Unit type (optional)</Label>
				<Select id="unitType" {...register('unitType')}>
					<option value="">Not specified</option>
					{UNIT_TYPES.map((t) => (
						<option key={t} value={t}>
							{formatEnumLabel(t)}
						</option>
					))}
				</Select>
			</div>
			<div className="space-y-2">
				<Label htmlFor="description">Description (optional)</Label>
				<textarea
					id="description"
					{...register('description')}
					placeholder="Notes about this unit"
					maxLength={2000}
					rows={3}
					className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
				/>
			</div>
			<div className="flex flex-col gap-2">
				<Controller
					name="balcony"
					control={control}
					render={({ field }) => (
						<div className="flex items-center gap-2">
							<Checkbox
								id="balcony"
								checked={field.value}
								onCheckedChange={(checked) => field.onChange(!!checked)}
							/>
							<Label
								htmlFor="balcony"
								className="text-sm font-normal cursor-pointer"
							>
								Balcony
							</Label>
						</div>
					)}
				/>
				<Controller
					name="laundryInUnit"
					control={control}
					render={({ field }) => (
						<div className="flex items-center gap-2">
							<Checkbox
								id="laundryInUnit"
								checked={field.value}
								onCheckedChange={(checked) => field.onChange(!!checked)}
							/>
							<Label
								htmlFor="laundryInUnit"
								className="text-sm font-normal cursor-pointer"
							>
								Laundry in unit
							</Label>
						</div>
					)}
				/>
				<Controller
					name="hardwoodFloors"
					control={control}
					render={({ field }) => (
						<div className="flex items-center gap-2">
							<Checkbox
								id="hardwoodFloors"
								checked={field.value}
								onCheckedChange={(checked) => field.onChange(!!checked)}
							/>
							<Label
								htmlFor="hardwoodFloors"
								className="text-sm font-normal cursor-pointer"
							>
								Hardwood floors
							</Label>
						</div>
					)}
				/>
			</div>
			<div className="grid grid-cols-3 gap-4">
				<div className="space-y-2">
					<Label htmlFor="bedrooms">Bedrooms</Label>
					<Input
						id="bedrooms"
						{...register('bedrooms')}
						type="number"
						min={0}
						placeholder="—"
					/>
					<FieldError message={errors.bedrooms?.message} />
				</div>
				<div className="space-y-2">
					<Label htmlFor="bathrooms">Bathrooms</Label>
					<Input
						id="bathrooms"
						{...register('bathrooms')}
						type="number"
						min={0}
						step={0.5}
						placeholder="—"
					/>
					<FieldError message={errors.bathrooms?.message} />
				</div>
				<div className="space-y-2">
					<Label htmlFor="squareFootage">Sq ft</Label>
					<Input
						id="squareFootage"
						{...register('squareFootage')}
						type="number"
						min={0}
						placeholder="—"
					/>
					<FieldError message={errors.squareFootage?.message} />
				</div>
			</div>
			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-2">
					<Label htmlFor="rentAmount">Rent ($)</Label>
					<Input
						id="rentAmount"
						{...register('rentAmount')}
						type="number"
						min={0}
						step={0.01}
						placeholder="Optional"
					/>
					<FieldError message={errors.rentAmount?.message} />
				</div>
				<div className="space-y-2">
					<Label htmlFor="securityDeposit">Security deposit ($)</Label>
					<Input
						id="securityDeposit"
						{...register('securityDeposit')}
						type="number"
						min={0}
						step={0.01}
						placeholder="Optional"
					/>
					<FieldError message={errors.securityDeposit?.message} />
				</div>
			</div>

			<DialogFooter>
				{onCancel && (
					<Button type="button" variant="outline" onClick={onCancel}>
						Cancel
					</Button>
				)}
				<Button type="submit" disabled={pending}>
					{pending ? 'Saving…' : submitLabel}
				</Button>
			</DialogFooter>
		</form>
	)
}
