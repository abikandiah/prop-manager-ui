import { useFormContext } from 'react-hook-form'
import { Input } from '@abumble/design-system/components/Input'
import { Label } from '@abumble/design-system/components/Label'
import { FieldError } from '@/components/ui/FieldError'

// Shape shared between the form schema and this component
export interface AddressFields {
	addressLine1: string
	addressLine2: string
	city: string
	stateProvinceRegion: string
	postalCode: string
	countryCode: string
}

// The parent form must have an `address` key matching AddressFields
type ParentFormWithAddress = { address: AddressFields }

export function AddressFormFields() {
	const {
		register,
		formState: { errors },
	} = useFormContext<ParentFormWithAddress>()

	const addressErrors = errors.address

	return (
		<fieldset className="rounded border bg-muted/20 p-5">
			<legend className="text-sm font-semibold text-foreground px-2 -mx-2">
				Address
			</legend>
			<div className="grid gap-4">
				<div className="space-y-1.5">
					<Label htmlFor="addressLine1" className="text-foreground">
						Street Address{' '}
						<span className="text-destructive" aria-hidden>
							*
						</span>
					</Label>
					<Input
						id="addressLine1"
						{...register('address.addressLine1')}
						placeholder="Street Address"
						className="w-full"
					/>
					<FieldError message={addressErrors?.addressLine1?.message} />
				</div>
				<div className="space-y-1.5">
					<Label htmlFor="addressLine2" className="text-foreground">
						Apt, Suite, Unit, etc. (optional)
					</Label>
					<Input
						id="addressLine2"
						{...register('address.addressLine2')}
						placeholder="Apt, Suite, Unit, etc."
						className="w-full"
					/>
				</div>
				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-1.5">
						<Label htmlFor="countryCode" className="text-foreground">
							Country{' '}
							<span className="text-destructive" aria-hidden>
								*
							</span>
						</Label>
						<Input
							id="countryCode"
							{...register('address.countryCode')}
							placeholder="Country"
							maxLength={2}
						/>
						<FieldError message={addressErrors?.countryCode?.message} />
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="stateProvinceRegion" className="text-foreground">
							Province / State{' '}
							<span className="text-destructive" aria-hidden>
								*
							</span>
						</Label>
						<Input
							id="stateProvinceRegion"
							{...register('address.stateProvinceRegion')}
							placeholder="Province/State"
						/>
						<FieldError message={addressErrors?.stateProvinceRegion?.message} />
					</div>
				</div>
				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-1.5">
						<Label htmlFor="city" className="text-foreground">
							City{' '}
							<span className="text-destructive" aria-hidden>
								*
							</span>
						</Label>
						<Input id="city" {...register('address.city')} placeholder="City" />
						<FieldError message={addressErrors?.city?.message} />
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="postalCode" className="text-foreground">
							Zip / Postal Code{' '}
							<span className="text-destructive" aria-hidden>
								*
							</span>
						</Label>
						<Input
							id="postalCode"
							{...register('address.postalCode')}
							placeholder="Zip/Postal Code"
						/>
						<FieldError message={addressErrors?.postalCode?.message} />
					</div>
				</div>
			</div>
		</fieldset>
	)
}
