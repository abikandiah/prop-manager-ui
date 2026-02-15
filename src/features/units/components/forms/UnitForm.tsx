import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@abumble/design-system/components/Button'
import { Input } from '@abumble/design-system/components/Input'
import { Checkbox } from '@abumble/design-system/components/Checkbox'
import { DialogFooter } from '@abumble/design-system/components/Dialog'
import { Label } from '@abumble/design-system/components/Label'
import { Select } from '@abumble/design-system/components/Select'
import { useCreateUnit, useUpdateUnit } from '@/features/units/hooks'
import { usePropsList } from '@/features/props'
import {
	UNIT_STATUSES,
	UNIT_TYPES,
	type CreateUnitPayload,
	type Unit,
	type UnitStatus,
	type UnitType,
	type UpdateUnitPayload,
} from '@/domain/unit'
import { generateId } from '@/lib/util'

type FormState = {
	propertyId: string
	unitNumber: string
	unitType: UnitType | ''
	status: UnitStatus
	description: string
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
	propertyId: '',
	unitNumber: '',
	unitType: '',
	status: 'VACANT',
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

function unitToFormState(unit: Unit): FormState {
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
	const [form, setForm] = useState<FormState>(() => {
		const state = initialUnit ? unitToFormState(initialUnit) : initialFormState
		if (propId) state.propertyId = propId
		return state
	})
	const createUnit = useCreateUnit()
	const updateUnit = useUpdateUnit()
	const { data: propsList } = usePropsList()

	useEffect(() => {
		if (initialUnit) {
			setForm(unitToFormState(initialUnit))
		} else {
			setForm((prev) => ({ ...initialFormState, propertyId: propId ?? prev.propertyId }))
		}
	}, [initialUnit, propId])

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
						: name === 'unitType'
							? (value as UnitType | '')
							: value,
		}))
	}

	const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setForm((prev) => ({ ...prev, description: e.target.value }))
	}

	const buildCreatePayload = (): CreateUnitPayload => ({
		id: generateId(), // ✅ Generate client-side ID for idempotency
		propertyId: form.propertyId || propId || '',
		unitNumber: form.unitNumber.trim(),
		unitType: form.unitType || undefined,
		status: form.status,
		description: form.description.trim() || undefined,
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
		balcony: form.balcony ? true : undefined,
		laundryInUnit: form.laundryInUnit ? true : undefined,
		hardwoodFloors: form.hardwoodFloors ? true : undefined,
	})

	const buildUpdatePayload = (): UpdateUnitPayload => ({
		propertyId: form.propertyId,
		unitNumber: form.unitNumber.trim(),
		unitType: form.unitType || null,
		status: form.status,
		description: form.description.trim() || null,
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
		version: initialUnit?.version ?? 0,
	})

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		if (!form.propertyId && !propId) {
			toast.error('Property is required')
			return
		}
		if (!form.unitNumber.trim()) {
			toast.error('Unit number is required')
			return
		}

		// Validate numeric fields
		if (form.rentAmount.trim() && isNaN(parseFloat(form.rentAmount))) {
			toast.error('Rent amount must be a valid number')
			return
		}
		if (
			form.securityDeposit.trim() &&
			isNaN(parseFloat(form.securityDeposit))
		) {
			toast.error('Security deposit must be a valid number')
			return
		}
		if (form.bedrooms.trim() && isNaN(parseInt(form.bedrooms, 10))) {
			toast.error('Bedrooms must be a valid number')
			return
		}
		if (form.bathrooms.trim() && isNaN(parseInt(form.bathrooms, 10))) {
			toast.error('Bathrooms must be a valid number')
			return
		}
		if (
			form.squareFootage.trim() &&
			isNaN(parseInt(form.squareFootage, 10))
		) {
			toast.error('Square footage must be a valid number')
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
						toast.error(err.message || 'Failed to update unit')
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
					toast.error(err.message || 'Failed to create unit')
				},
			})
		}
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-4 pt-4">
			{!propId && (
				<div className="space-y-2">
					<Label htmlFor="propertyId">
						Property{' '}
						<span className="text-destructive" aria-hidden>
							*
						</span>
					</Label>
					<Select
						id="propertyId"
						name="propertyId"
						value={form.propertyId}
						onChange={handleChange}
						required
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
			<div className="space-y-2">
				<Label htmlFor="unitType">Unit type (optional)</Label>
				<Select
					id="unitType"
					name="unitType"
					value={form.unitType}
					onChange={handleChange}
				>
					<option value="">Not specified</option>
					{UNIT_TYPES.map((t) => (
						<option key={t} value={t}>
							{t.replace(/_/g, ' ')}
						</option>
					))}
				</Select>
			</div>
			<div className="space-y-2">
				<Label htmlFor="description">Description (optional)</Label>
				<textarea
					id="description"
					value={form.description}
					onChange={handleTextareaChange}
					placeholder="Notes about this unit"
					maxLength={2000}
					rows={3}
					className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
				/>
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
					<Label
						htmlFor="balcony"
						className="text-sm font-normal cursor-pointer"
					>
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
