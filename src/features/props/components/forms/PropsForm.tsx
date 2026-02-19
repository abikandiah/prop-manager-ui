import { useEffect } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { z } from 'zod'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@abumble/design-system/components/Button'
import { Input } from '@abumble/design-system/components/Input'
import { toast } from 'sonner'
import { DialogFooter } from '@abumble/design-system/components/Dialog'
import { Label } from '@abumble/design-system/components/Label'
import { Select } from '@abumble/design-system/components/Select'
import { Textarea } from '@abumble/design-system/components/Textarea'
import { AddressFormFields } from './AddressFormFields'
import type { CreatePropPayload, Prop } from '@/domain/property'
import { FieldError } from '@/components/ui/FieldError'
import { PROPERTY_TYPES, PropertyType } from '@/domain/property'
import { useCreateProp, useUpdateProp } from '@/features/props/hooks'
import { formatEnumLabel } from '@/lib/format'

const MAX_YEAR_BUILT = new Date().getFullYear() + 1

const propFormSchema = z.object({
	legalName: z.string().min(1, 'Property name is required').max(255),
	propertyType: z.nativeEnum(PropertyType),
	description: z.string().max(2000).optional(),
	address: z.object({
		addressLine1: z.string().min(1, 'Street address is required'),
		addressLine2: z.string(),
		city: z.string().min(1, 'City is required'),
		stateProvinceRegion: z.string().min(1, 'Province/State is required'),
		postalCode: z.string().min(1, 'Zip/postal code is required'),
		countryCode: z
			.string()
			.length(2, 'Country code must be 2 characters (e.g. US)'),
	}),
	parcelNumber: z.string().max(64).optional(),
	totalArea: z
		.string()
		.refine(
			(s) => s.trim() === '' || (Number.isInteger(Number(s)) && Number(s) >= 0),
			'Must be a whole number',
		)
		.optional(),
	yearBuilt: z
		.string()
		.refine(
			(s) =>
				s.trim() === '' ||
				(Number.isInteger(Number(s)) &&
					Number(s) >= 1800 &&
					Number(s) <= MAX_YEAR_BUILT),
			`Must be a year between 1800 and ${MAX_YEAR_BUILT}`,
		)
		.optional(),
})

type PropFormValues = z.infer<typeof propFormSchema>

const defaultValues: PropFormValues = {
	legalName: '',
	propertyType: PropertyType.CONDOMINIUM,
	description: '',
	address: {
		addressLine1: '',
		addressLine2: '',
		city: '',
		stateProvinceRegion: '',
		postalCode: '',
		countryCode: '',
	},
	parcelNumber: '',
	totalArea: '',
	yearBuilt: '',
}

function propToFormValues(prop: Prop): PropFormValues {
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
			: defaultValues.address,
		parcelNumber: prop.parcelNumber ?? '',
		totalArea: prop.totalArea != null ? String(prop.totalArea) : '',
		yearBuilt: prop.yearBuilt != null ? String(prop.yearBuilt) : '',
	}
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

	const form = useForm<PropFormValues>({
		resolver: standardSchemaResolver(propFormSchema),
		defaultValues: initialProp ? propToFormValues(initialProp) : defaultValues,
		mode: 'onChange',
	})

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors, isValid },
	} = form

	// Sync form when the prop being edited changes
	useEffect(() => {
		reset(initialProp ? propToFormValues(initialProp) : defaultValues)
	}, [initialProp?.id, reset])

	const pending = createProp.isPending || updateProp.isPending

	const onSubmit = (values: PropFormValues) => {
		const payload: Omit<CreatePropPayload, 'id'> & { version: number } = {
			legalName: values.legalName.trim(),
			address: {
				addressLine1: values.address.addressLine1.trim(),
				addressLine2: values.address.addressLine2.trim() || undefined,
				city: values.address.city.trim(),
				stateProvinceRegion: values.address.stateProvinceRegion.trim(),
				postalCode: values.address.postalCode.trim(),
				countryCode: values.address.countryCode.trim().toUpperCase(),
			},
			propertyType: values.propertyType,
			description: values.description?.trim() || undefined,
			parcelNumber: values.parcelNumber?.trim() || undefined,
			totalArea: values.totalArea?.trim()
				? parseInt(values.totalArea, 10)
				: undefined,
			yearBuilt: values.yearBuilt?.trim()
				? parseInt(values.yearBuilt, 10)
				: undefined,
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
				},
			)
		} else {
			createProp.mutate(payload, {
				onSuccess: (data) => {
					reset(defaultValues)
					toast.success('Property created successfully')
					if (onSuccess) {
						onSuccess(data)
					} else {
						navigate({ to: '/props/$id', params: { id: data.id } })
					}
				},
			})
		}
	}

	return (
		<FormProvider {...form}>
			<form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
				<div className="space-y-2">
					<Label htmlFor="legalName">
						Property name{' '}
						<span className="text-destructive" aria-hidden>
							*
						</span>
					</Label>
					<Input
						id="legalName"
						{...register('legalName')}
						placeholder="e.g. 123 Main Street LLC"
						maxLength={255}
					/>
					<FieldError message={errors.legalName?.message} />
				</div>
				<div className="space-y-2">
					<Label htmlFor="propertyType">Property type</Label>
					<Select id="propertyType" {...register('propertyType')}>
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
						{...register('description')}
						placeholder="Notes about this property"
						maxLength={2000}
						rows={3}
						className="min-h-[80px]"
					/>
				</div>
				<AddressFormFields />
				<div className="grid grid-cols-2 gap-2">
					<div className="space-y-2">
						<Label htmlFor="totalArea">Total area (sq ft)</Label>
						<Input
							id="totalArea"
							{...register('totalArea')}
							type="number"
							min={0}
							placeholder="Optional"
						/>
						<FieldError message={errors.totalArea?.message} />
					</div>
					<div className="space-y-2">
						<Label htmlFor="yearBuilt">Year built</Label>
						<Input
							id="yearBuilt"
							{...register('yearBuilt')}
							type="number"
							min={1800}
							max={MAX_YEAR_BUILT}
							placeholder="Optional"
						/>
						<FieldError message={errors.yearBuilt?.message} />
					</div>
				</div>
				<div className="space-y-2">
					<Label htmlFor="parcelNumber">Parcel number (optional)</Label>
					<Input
						id="parcelNumber"
						{...register('parcelNumber')}
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
					<Button type="submit" disabled={pending || !isValid}>
						{pending ? (isEdit ? 'Updating…' : 'Creating…') : submitLabel}
					</Button>
				</DialogFooter>
			</form>
		</FormProvider>
	)
}
