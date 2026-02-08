import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@abumble/design-system/components/Button'
import { Input } from '@abumble/design-system/components/Input'
import { toast } from 'sonner'
import { useCreateProp } from '@/features/props/hooks'
import {
	PROPERTY_TYPES,
	type CreatePropPayload,
	type PropertyType,
} from '@/features/props/props'
import {
	AddressFormFields,
	ADDRESS_FORM_INITIAL,
	type AddressFormValue,
} from './AddressFormFields'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { cn } from '@abumble/design-system/utils'

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

function isRequiredFieldsValid(
	legalName: string,
	address: AddressFormValue,
): boolean {
	return (
		legalName.trim().length > 0 &&
		address.addressLine1.trim().length > 0 &&
		address.city.trim().length > 0 &&
		address.stateProvinceRegion.trim().length > 0 &&
		address.postalCode.trim().length > 0 &&
		address.countryCode.trim().length === 2
	)
}

export function PropsForm() {
	const navigate = useNavigate()
	const createProp = useCreateProp()
	const [isDialogOpen, setIsDialogOpen] = useState(false)
	const [form, setForm] = useState<FormState>(initialForm)
	const {
		legalName,
		propertyType,
		address,
		parcelNumber,
		totalArea,
		yearBuilt,
		isActive,
	} = form

	const updateAddress = (field: keyof AddressFormValue, value: string) =>
		setForm((prev) => ({
			...prev,
			address: { ...prev.address, [field]: value },
		}))

	const canSubmit = isRequiredFieldsValid(legalName, address)

	type FormFieldName = Exclude<keyof FormState, 'address'>
	const onFormChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
	) => {
		const { name, value } = e.target
		const field = name as FormFieldName
		if (name in initialForm && name !== 'address') {
			setForm((prev) => ({
				...prev,
				[field]: field === 'propertyType' ? (value as PropertyType) : value,
			}))
		}
	}

	const handleCreate = (e: React.SubmitEvent) => {
		e.preventDefault()
		if (!legalName.trim()) return
		if (
			!address.addressLine1.trim() ||
			!address.city.trim() ||
			!address.stateProvinceRegion.trim() ||
			!address.postalCode.trim() ||
			!address.countryCode.trim()
		) {
			toast.error('Please fill in all required address fields')
			return
		}
		if (address.countryCode.length !== 2) {
			toast.error('Country code must be 2 characters (e.g. US)')
			return
		}

		const payload: CreatePropPayload = {
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
		}

		createProp.mutate(payload, {
			onSuccess: (data) => {
				setForm(initialForm)
				setIsDialogOpen(false)
				toast.success('Property created successfully')
				navigate({ to: '/props/$id', params: { id: data.id } })
			},
			onError: (err) => {
				toast.error(`Failed to create property: ${err.message}`)
			},
		})
	}

	return (
		<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
			<DialogTrigger asChild>
				<Button>
					<Plus className="size-4" />
					Add Property
				</Button>
			</DialogTrigger>

			<DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Add Property</DialogTitle>
					<DialogDescription>
						Enter the legal name, address, and property details.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleCreate} className="space-y-4 pt-4">
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
						<select
							id="propertyType"
							name="propertyType"
							value={propertyType}
							onChange={onFormChange}
							className={cn(
								'flex h-9 w-full rounded border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors',
								'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
							)}
						>
							{PROPERTY_TYPES.map((t) => (
								<option key={t} value={t}>
									{t.replace(/_/g, ' ')}
								</option>
							))}
						</select>
					</div>
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

					<AddressFormFields value={address} onChange={updateAddress} />

					<DialogFooter>
						<Button
							variant="outline"
							type="button"
							onClick={() => setIsDialogOpen(false)}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={createProp.isPending || !canSubmit}>
							{createProp.isPending ? 'Creating…' : 'Create Property'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}
