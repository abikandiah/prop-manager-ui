import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@abumble/design-system/components/Button'
import { Input } from '@abumble/design-system/components/Input'
import { toast } from 'sonner'
import { DialogFooter } from '@abumble/design-system/components/Dialog'
import { Label } from '@abumble/design-system/components/Label'
import { Select } from '@abumble/design-system/components/Select'
import { Textarea } from '@abumble/design-system/components/Textarea'
import { ADDRESS_FORM_INITIAL, AddressFormFields } from './AddressFormFields'
import type { AddressFormValue } from './AddressFormFields'
import type { CreatePropPayload, Prop } from '@/domain/property'
import { PropertyType, PROPERTY_TYPES } from '@/domain/property'
import { useCreateProp, useUpdateProp } from '@/features/props/hooks'
import { formatEnumLabel } from '@/lib/format'

type FormState = {
	legalName: string
	propertyType: PropertyType
	description: string
	address: AddressFormValue
	parcelNumber: string
	totalArea: string
	yearBuilt: string
}

const initialForm: FormState = {
	legalName: '',
	propertyType: PropertyType.CONDOMINIUM,
	description: '',
	address: ADDRESS_FORM_INITIAL,
	parcelNumber: '',
	totalArea: '',
	yearBuilt: '',
}

const MAX_YEAR_BUILT = new Date().getFullYear() + 1

function propToFormState(prop: Prop): FormState {
	return {
		legalName: prop.legalName,
		propertyType: prop.propertyType,
		description: prop.description ?? '',
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
	if (!address.postalCode.trim())
		return 'Please fill in all required address fields'
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
		description,
		address,
		parcelNumber,
		totalArea,
		yearBuilt,
	} = form

	const syncedInitialIdRef = useRef<string | undefined>(initialProp?.id)
	useEffect(() => {
		const nextId = initialProp?.id
		if (syncedInitialIdRef.current === nextId) return
		syncedInitialIdRef.current = nextId
		setForm(initialProp ? propToFormState(initialProp) : initialForm)
	}, [initialProp])

	const updateAddress = useCallback(
		(field: keyof AddressFormValue, value: string) => {
			setForm((prev) => ({
				...prev,
				address: { ...prev.address, [field]: value },
			}))
		},
		[],
	)

	const validationError = validatePropForm(legalName, address)
	const canSubmit = validationError === null
	const pending = createProp.isPending || updateProp.isPending

	type FormFieldName = Exclude<keyof FormState, 'address'>
	const onFormChange = useCallback(
		(
			e: React.ChangeEvent<
				HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
			>,
		) => {
			const { name, value } = e.target
			const field = name as FormFieldName
			if (field in initialForm) {
				setForm((prev) => ({
					...prev,
					[field]: field === 'propertyType' ? (value as PropertyType) : value,
				}))
			}
		},
		[],
	)

	const handleSubmit = useCallback(
		(e: React.SubmitEvent<HTMLFormElement>) => {
			e.preventDefault()
			const validationErr = validatePropForm(legalName, address)
			if (validationErr) {
				toast.error(validationErr)
				return
			}
			if (totalArea.trim() && isNaN(parseInt(totalArea, 10))) {
				toast.error('Total area must be a valid number')
				return
			}
			if (yearBuilt.trim() && isNaN(parseInt(yearBuilt, 10))) {
				toast.error('Year built must be a valid number')
				return
			}

			const payload: Omit<CreatePropPayload, 'id'> & { version: number } = {
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
				description: description.trim() || undefined,
				parcelNumber: parcelNumber.trim() || undefined,
				totalArea: totalArea.trim() ? parseInt(totalArea, 10) : undefined,
				yearBuilt: yearBuilt.trim() ? parseInt(yearBuilt, 10) : undefined,
				version: initialProp?.version ?? 0,
			}

			if (isEdit) {
				updateProp.mutate(
					{ id: initialProp.id, payload },
					{
						onSuccess: () => {
							toast.success('Property updated')
							onSuccess?.()
						},
						onError: (error) => {
							toast.error(error.message || 'Failed to update property')
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
					onError: (error) => {
						toast.error(
							`Failed to create property: ${error.message || 'Unknown'}`,
						)
					},
				})
			}
		},
		[
			legalName,
			address,
			propertyType,
			description,
			parcelNumber,
			totalArea,
			yearBuilt,
			isEdit,
			initialProp,
			createProp,
			updateProp,
			onSuccess,
			navigate,
		],
	)

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
							{formatEnumLabel(t)}
						</option>
					))}
				</Select>
			</div>
			<div className="space-y-2">
				<Label htmlFor="description">Description (optional)</Label>
				<Textarea
					id="description"
					name="description"
					value={description}
					onChange={onFormChange}
					placeholder="Notes about this property"
					maxLength={2000}
					rows={3}
					className="min-h-[80px]"
				/>
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
						max={MAX_YEAR_BUILT}
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
