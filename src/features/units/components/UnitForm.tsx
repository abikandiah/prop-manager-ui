import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@abumble/design-system/components/Button'
import { Input } from '@abumble/design-system/components/Input'
import { Checkbox } from '@/components/ui/checkbox'
import { DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { useCreateUnit, useUpdateUnit } from '@/features/units/hooks'
import {
	UNIT_STATUSES,
	type CreateUnitPayload,
	type Unit,
	type UnitStatus,
	type UpdateUnitPayload,
} from '@/features/units/units'

type FormState = {
	unitNumber: string
	status: UnitStatus
	rentAmount: string
	securityDeposit: string
	bedrooms: string
	bathrooms: string
	squareFootage: string
	balcony: boolean
	laundryInUnit: boolean
	hardwoodFloors: boolean
}

const initialFormState: FormState = {
	unitNumber: '',
	status: 'VACANT',
	rentAmount: '',
	securityDeposit: '',
	bedrooms: '',
	bathrooms: '',
	squareFootage: '',
	balcony: false,
	laundryInUnit: false,
	hardwoodFloors: false,
}

function unitToFormState(unit: Unit): FormState {
	return {
		unitNumber: unit.unitNumber,
		status: unit.status,
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
	propId: string
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
	const [form, setForm] = useState<FormState>(() =>
		initialUnit ? unitToFormState(initialUnit) : initialFormState,
	)
	const createUnit = useCreateUnit()
	const updateUnit = useUpdateUnit()

	useEffect(() => {
		if (initialUnit) {
			setForm(unitToFormState(initialUnit))
		} else {
			setForm(initialFormState)
		}
	}, [initialUnit])

	const pending = createUnit.isPending || updateUnit.isPending

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
	) => {
		const { name, value, type } = e.target
		const checked = (e.target as HTMLInputElement).checked
		setForm((prev) => ({
			...prev,
			[name]:
				type === 'checkbox'
					? checked
					: name === 'status'
						? (value as UnitStatus)
						: value,
		}))
	}

	const buildCreatePayload = (): CreateUnitPayload => ({
		propertyId: propId,
		unitNumber: form.unitNumber.trim(),
		status: form.status,
		rentAmount: form.rentAmount.trim()
			? parseFloat(form.rentAmount)
			: undefined,
		securityDeposit: form.securityDeposit.trim()
			? parseFloat(form.securityDeposit)
			: undefined,
		bedrooms: form.bedrooms.trim() ? parseInt(form.bedrooms, 10) : undefined,
		bathrooms: form.bathrooms.trim() ? parseInt(form.bathrooms, 10) : undefined,
		squareFootage: form.squareFootage.trim()
			? parseInt(form.squareFootage, 10)
			: undefined,
		balcony: form.balcony || undefined,
		laundryInUnit: form.laundryInUnit || undefined,
		hardwoodFloors: form.hardwoodFloors || undefined,
	})

	const buildUpdatePayload = (): UpdateUnitPayload => ({
		unitNumber: form.unitNumber.trim(),
		status: form.status,
		rentAmount: form.rentAmount.trim() ? parseFloat(form.rentAmount) : null,
		securityDeposit: form.securityDeposit.trim()
			? parseFloat(form.securityDeposit)
			: null,
		bedrooms: form.bedrooms.trim() ? parseInt(form.bedrooms, 10) : null,
		bathrooms: form.bathrooms.trim() ? parseInt(form.bathrooms, 10) : null,
		squareFootage: form.squareFootage.trim()
			? parseInt(form.squareFootage, 10)
			: null,
		balcony: form.balcony,
		laundryInUnit: form.laundryInUnit,
		hardwoodFloors: form.hardwoodFloors,
	})

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		if (!form.unitNumber.trim()) {
			toast.error('Unit number is required')
			return
		}

		if (isEdit && initialUnit) {
			updateUnit.mutate(
				{
					id: initialUnit.id,
					payload: buildUpdatePayload(),
				},
				{
					onSuccess: () => {
						toast.success('Unit updated')
						onSuccess?.()
					},
					onError: (err) => {
						toast.error(err?.message ?? 'Failed to update unit')
					},
				},
			)
		} else {
			createUnit.mutate(buildCreatePayload(), {
				onSuccess: () => {
					toast.success('Unit created')
					setForm(initialFormState)
					onSuccess?.()
				},
				onError: (err) => {
					toast.error(err?.message ?? 'Failed to create unit')
				},
			})
		}
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-4 pt-4">
			<div className="space-y-2">
				<Label htmlFor="unitNumber">
					Unit number{' '}
					<span className="text-destructive" aria-hidden>
						*
					</span>
				</Label>
				<Input
					id="unitNumber"
					name="unitNumber"
					value={form.unitNumber}
					onChange={handleChange}
					placeholder="e.g. 101"
					required
					maxLength={64}
				/>
			</div>
			<div className="space-y-2">
				<Label htmlFor="status">Status</Label>
				<Select
					id="status"
					name="status"
					value={form.status}
					onChange={handleChange}
				>
					{UNIT_STATUSES.map((s) => (
						<option key={s} value={s}>
							{s.replace(/_/g, ' ')}
						</option>
					))}
				</Select>
			</div>
			<div className="grid grid-cols-3 gap-4">
				<div className="space-y-2">
					<Label htmlFor="bedrooms">Bedrooms</Label>
					<Input
						id="bedrooms"
						name="bedrooms"
						type="number"
						min={0}
						value={form.bedrooms}
						onChange={handleChange}
						placeholder="—"
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="bathrooms">Bathrooms</Label>
					<Input
						id="bathrooms"
						name="bathrooms"
						type="number"
						min={0}
						step={0.5}
						value={form.bathrooms}
						onChange={handleChange}
						placeholder="—"
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="squareFootage">Sq ft</Label>
					<Input
						id="squareFootage"
						name="squareFootage"
						type="number"
						min={0}
						value={form.squareFootage}
						onChange={handleChange}
						placeholder="—"
					/>
				</div>
			</div>
			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-2">
					<Label htmlFor="rentAmount">Rent ($)</Label>
					<Input
						id="rentAmount"
						name="rentAmount"
						type="number"
						min={0}
						step={0.01}
						value={form.rentAmount}
						onChange={handleChange}
						placeholder="Optional"
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="securityDeposit">Security deposit ($)</Label>
					<Input
						id="securityDeposit"
						name="securityDeposit"
						type="number"
						min={0}
						step={0.01}
						value={form.securityDeposit}
						onChange={handleChange}
						placeholder="Optional"
					/>
				</div>
			</div>
			<div className="flex flex-col gap-2">
				<div className="flex items-center gap-2">
					<Checkbox
						id="balcony"
						checked={form.balcony}
						onCheckedChange={(checked) =>
							setForm((prev) => ({ ...prev, balcony: !!checked }))
						}
					/>
					<Label htmlFor="balcony" className="text-sm font-normal cursor-pointer">
						Balcony
					</Label>
				</div>
				<div className="flex items-center gap-2">
					<Checkbox
						id="laundryInUnit"
						checked={form.laundryInUnit}
						onCheckedChange={(checked) =>
							setForm((prev) => ({ ...prev, laundryInUnit: !!checked }))
						}
					/>
					<Label
						htmlFor="laundryInUnit"
						className="text-sm font-normal cursor-pointer"
					>
						Laundry in unit
					</Label>
				</div>
				<div className="flex items-center gap-2">
					<Checkbox
						id="hardwoodFloors"
						checked={form.hardwoodFloors}
						onCheckedChange={(checked) =>
							setForm((prev) => ({ ...prev, hardwoodFloors: !!checked }))
						}
					/>
					<Label
						htmlFor="hardwoodFloors"
						className="text-sm font-normal cursor-pointer"
					>
						Hardwood floors
					</Label>
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
