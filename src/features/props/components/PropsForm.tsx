import { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@abumble/design-system/components/Button'
import { Input } from '@abumble/design-system/components/Input'
import { toast } from 'sonner'
import { useCreateProp, useUpdateProp } from '@/features/props/hooks'
import {
	PROPERTY_TYPES,
	type CreatePropPayload,
	type Prop,
	type PropertyType,
	type UpdatePropPayload,
} from '@/features/props/props'
import {
	AddressFormFields,
	ADDRESS_FORM_INITIAL,
	type AddressFormValue,
} from './AddressFormFields'
import { DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

type FormState = {
	legalName: string
	propertyType: PropertyType
	address: AddressFormValue
	parcelNumber: string
	totalArea: string
	yearBuilt: string
	isActive: boolean
}

const initialForm: FormState = {
	legalName: '',
	propertyType: 'CONDO_UNIT',
	address: ADDRESS_FORM_INITIAL,
	parcelNumber: '',
	totalArea: '',
	yearBuilt: '',
	isActive: true,
}

function propToFormState(prop: Prop): FormState {
	return {
		legalName: prop.legalName,
		propertyType: prop.propertyType,
		address: prop.address
			? {
					addressLine1: prop.address.addressLine1,
					addressLine2: prop.address.addressLine2 ?? '',
					city: prop.address.city,
					stateProvinceRegion: prop.address.stateProvinceRegion,
					postalCode: prop.address.postalCode,
					countryCode: prop.address.countryCode,
				}
			: ADDRESS_FORM_INITIAL,
		parcelNumber: prop.parcelNumber ?? '',
		totalArea: prop.totalArea != null ? String(prop.totalArea) : '',
		yearBuilt: prop.yearBuilt != null ? String(prop.yearBuilt) : '',
		isActive: prop.isActive,
	}
}

function validatePropForm(
	legalName: string,
	address: AddressFormValue,
): string | null {
	if (!legalName.trim()) return 'Legal name is required'
	if (!address.addressLine1.trim())
		return 'Please fill in all required address fields'
	if (!address.city.trim()) return 'Please fill in all required address fields'
	if (!address.stateProvinceRegion.trim())
		return 'Please fill in all required address fields'
	if (!address.postalCode.trim()) return 'Please fill in all required address fields'
	if (address.countryCode.trim().length !== 2)
		return 'Country code must be 2 characters (e.g. US)'
	return null
}

export interface PropsFormProps {
	initialProp?: Prop | null
	onSuccess?: (data?: Prop) => void
	onCancel?: () => void
	submitLabel?: string
}

export function PropsForm({
	initialProp = null,
	onSuccess,
	onCancel,
	submitLabel = 'Create Property',
}: PropsFormProps) {
	const navigate = useNavigate()
	const isEdit = initialProp != null
	const createProp = useCreateProp()
	const updateProp = useUpdateProp()
	const [form, setForm] = useState<FormState>(() =>
		initialProp ? propToFormState(initialProp) : initialForm,
	)
	const {
		legalName,
		propertyType,
		address,
		parcelNumber,
		totalArea,
		yearBuilt,
		isActive,
	} = form

	useEffect(() => {
		if (initialProp) {
			setForm(propToFormState(initialProp))
		} else {
			setForm(initialForm)
		}
	}, [initialProp])

	const updateAddress = (field: keyof AddressFormValue, value: string) =>
		setForm((prev) => ({
			...prev,
			address: { ...prev.address, [field]: value },
		}))

	const validationError = validatePropForm(legalName, address)
	const canSubmit = validationError === null
	const pending = createProp.isPending || updateProp.isPending

	type FormFieldName = Exclude<keyof FormState, 'address' | 'isActive'>
	const onFormChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
	) => {
		const { name, value } = e.target
		const field = name as FormFieldName
		if (field in initialForm) {
			setForm((prev) => ({
				...prev,
				[field]: field === 'propertyType' ? (value as PropertyType) : value,
			}))
		}
	}

	const buildPayload = (): CreatePropPayload & UpdatePropPayload => ({
		legalName: legalName.trim(),
		address: {
			addressLine1: address.addressLine1.trim(),
			addressLine2: address.addressLine2.trim() || undefined,
			city: address.city.trim(),
			stateProvinceRegion: address.stateProvinceRegion.trim(),
			postalCode: address.postalCode.trim(),
			countryCode: address.countryCode.trim().toUpperCase(),
		},
		propertyType,
		parcelNumber: parcelNumber.trim() || undefined,
		totalArea: totalArea.trim() ? parseInt(totalArea, 10) : undefined,
		yearBuilt: yearBuilt.trim() ? parseInt(yearBuilt, 10) : undefined,
		isActive,
	})

	const handleSubmit = (e: React.SubmitEvent) => {
		e.preventDefault()
		const err = validatePropForm(legalName, address)
		if (err) {
			toast.error(err)
			return
		}
		const payload = buildPayload()

		if (isEdit && initialProp) {
			updateProp.mutate(
				{ id: initialProp.id, payload },
				{
					onSuccess: () => {
						toast.success('Property updated')
						onSuccess?.()
					},
					onError: (err) => {
						toast.error(err?.message ?? 'Failed to update property')
					},
				},
			)
		} else {
			createProp.mutate(payload, {
				onSuccess: (data) => {
					setForm(initialForm)
					toast.success('Property created successfully')
					if (onSuccess) {
						onSuccess(data)
					} else {
						navigate({ to: '/props/$id', params: { id: data.id } })
					}
				},
				onError: (err) => {
					toast.error(`Failed to create property: ${err.message}`)
				},
			})
		}
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-4 pt-4">
			<div className="space-y-2">
				<Label htmlFor="legalName">
					Legal name{' '}
					<span className="text-destructive" aria-hidden>
						*
					</span>
				</Label>
				<Input
					id="legalName"
					name="legalName"
					value={legalName}
					onChange={onFormChange}
					placeholder="e.g. 123 Main Street LLC"
					required
					maxLength={255}
				/>
			</div>
			<div className="space-y-2">
				<Label htmlFor="propertyType">Property type</Label>
				<Select
					id="propertyType"
					name="propertyType"
					value={propertyType}
					onChange={onFormChange}
				>
					{PROPERTY_TYPES.map((t) => (
						<option key={t} value={t}>
							{t.replace(/_/g, ' ')}
						</option>
					))}
				</Select>
			</div>
			<AddressFormFields value={address} onChange={updateAddress} />
			<div className="grid grid-cols-2 gap-2">
				<div className="space-y-2">
					<Label htmlFor="totalArea">Total area (sq ft)</Label>
					<Input
						id="totalArea"
						name="totalArea"
						type="number"
						min={0}
						value={totalArea}
						onChange={onFormChange}
						placeholder="Optional"
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="yearBuilt">Year built</Label>
					<Input
						id="yearBuilt"
						name="yearBuilt"
						type="number"
						min={1800}
						max={new Date().getFullYear() + 1}
						value={yearBuilt}
						onChange={onFormChange}
						placeholder="Optional"
					/>
				</div>
			</div>
			<div className="space-y-2">
				<Label htmlFor="parcelNumber">Parcel number (optional)</Label>
				<Input
					id="parcelNumber"
					name="parcelNumber"
					value={parcelNumber}
					onChange={onFormChange}
					placeholder="Tax/assessor parcel ID"
					maxLength={64}
				/>
			</div>
			<div className="flex items-center gap-2">
				<Checkbox
					id="isActive"
					checked={isActive}
					onCheckedChange={(checked) =>
						setForm((prev) => ({ ...prev, isActive: checked === true }))
					}
				/>
				<Label htmlFor="isActive" className="font-normal cursor-pointer">
					Active
				</Label>
			</div>

			<DialogFooter>
				{onCancel && (
					<Button variant="outline" type="button" onClick={onCancel}>
						Cancel
					</Button>
				)}
				<Button type="submit" disabled={pending || !canSubmit}>
					{pending ? (isEdit ? 'Updating…' : 'Creating…') : submitLabel}
				</Button>
			</DialogFooter>
		</form>
	)
}
