import { Input } from '@abumble/design-system/components/Input'
import { Label } from '@/components/ui/label'
export const ADDRESS_FORM_INITIAL = {
	addressLine1: '',
	addressLine2: '',
	city: '',
	stateProvinceRegion: '',
	postalCode: '',
	countryCode: '',
} as const

export type AddressFormValue = {
	[K in keyof typeof ADDRESS_FORM_INITIAL]: string
}

type Props = {
	value: AddressFormValue
	onChange: (field: keyof AddressFormValue, value: string) => void
}

export function AddressFormFields({ value: address, onChange }: Props) {
	const onFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target
		const field = name as keyof AddressFormValue
		if (field in ADDRESS_FORM_INITIAL) {
			const next =
				field === 'countryCode' ? value.toUpperCase().slice(0, 2) : value
			onChange(field, next)
		}
	}

	return (
		<fieldset className="rounded border bg-muted/20 p-5">
			<legend className="text-sm font-semibold text-foreground px-2 -mx-2">
				Address
			</legend>
			<div className="grid gap-4">
				<div className="space-y-1.5">
					<Label htmlFor="addressLine1" className="text-foreground">
						Street Address <span className="text-destructive" aria-hidden>*</span>
					</Label>
					<Input
						id="addressLine1"
						name="addressLine1"
						value={address.addressLine1}
						onChange={onFormChange}
						placeholder="Street Address"
						required
						className="w-full"
					/>
				</div>
				<div className="space-y-1.5">
					<Label htmlFor="addressLine2" className="text-foreground">
						Apt, Suite, Unit, etc. (optional)
					</Label>
					<Input
						id="addressLine2"
						name="addressLine2"
						value={address.addressLine2}
						onChange={onFormChange}
						placeholder="Apt, Suite, Unit, etc."
						className="w-full"
					/>
				</div>
				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-1.5">
						<Label htmlFor="countryCode" className="text-foreground">
							Country <span className="text-destructive" aria-hidden>*</span>
						</Label>
						<Input
							id="countryCode"
							name="countryCode"
							value={address.countryCode}
							onChange={onFormChange}
							placeholder="Country"
							maxLength={2}
							required
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="stateProvinceRegion" className="text-foreground">
							Province / State <span className="text-destructive" aria-hidden>*</span>
						</Label>
						<Input
							id="stateProvinceRegion"
							name="stateProvinceRegion"
							value={address.stateProvinceRegion}
							onChange={onFormChange}
							placeholder="Province/State"
							required
						/>
					</div>
				</div>
				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-1.5">
						<Label htmlFor="city" className="text-foreground">
							City <span className="text-destructive" aria-hidden>*</span>
						</Label>
						<Input
							id="city"
							name="city"
							value={address.city}
							onChange={onFormChange}
							placeholder="City"
							required
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="postalCode" className="text-foreground">
							Zip / Postal Code <span className="text-destructive" aria-hidden>*</span>
						</Label>
						<Input
							id="postalCode"
							name="postalCode"
							value={address.postalCode}
							onChange={onFormChange}
							placeholder="Zip/Postal Code"
							required
						/>
					</div>
				</div>
			</div>
		</fieldset>
	)
}
