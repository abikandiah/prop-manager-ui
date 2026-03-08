import { FieldError, FormFooter, ProfileField } from '@/components/ui'
import type { Tenant } from '@/domain/tenant'
import { useUpdateMyTenantProfile } from '@/features/tenant-portal/hooks'
import { FORM_DIALOG_CLASS } from '@/lib/dialog'
import { formatPhoneNumber, validatePhoneNumber } from '@/lib/phone'
import { Button } from '@abumble/design-system/components/Button'
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '@abumble/design-system/components/Card'
import { FormDialog } from '@abumble/design-system/components/Dialog'
import { Input } from '@abumble/design-system/components/Input'
import { Label } from '@abumble/design-system/components/Label'
import { Textarea } from '@abumble/design-system/components/Textarea'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

const schema = z.object({
	emergencyContactName: z.string().max(255).optional(),
	emergencyContactPhone: z
		.string()
		.max(50)
		.optional()
		.refine((val) => validatePhoneNumber(val), {
			message: 'Please enter a valid phone number (e.g. +1 555-555-5555)',
		}),
	hasPets: z.enum(['yes', 'no', '']).optional(),
	petDescription: z.string().optional(),
	vehicleInfo: z.string().max(255).optional(),
	notes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

function TenantProfileEditForm({
	tenant,
	onClose,
}: {
	tenant: Tenant
	onClose: () => void
}) {
	const update = useUpdateMyTenantProfile()
	const {
		register,
		handleSubmit,
		control,
		formState: { errors, isSubmitting },
	} = useForm<FormValues>({
		resolver: standardSchemaResolver(schema),
		defaultValues: {
			emergencyContactName: tenant.emergencyContactName ?? '',
			emergencyContactPhone: tenant.emergencyContactPhone ?? '',
			hasPets:
				tenant.hasPets === true ? 'yes' : tenant.hasPets === false ? 'no' : '',
			petDescription: tenant.petDescription ?? '',
			vehicleInfo: tenant.vehicleInfo ?? '',
			notes: tenant.notes ?? '',
		},
	})

	function onSubmit(values: FormValues) {
		update.mutate(
			{
				emergencyContactName: values.emergencyContactName || null,
				emergencyContactPhone:
					formatPhoneNumber(values.emergencyContactPhone) || null,
				hasPets:
					values.hasPets === 'yes'
						? true
						: values.hasPets === 'no'
							? false
							: null,
				petDescription: values.petDescription || null,
				vehicleInfo: values.vehicleInfo || null,
				notes: values.notes || null,
				version: tenant.version,
			},
			{
				onSuccess: () => {
					toast.success('Profile updated')
					onClose()
				},
			},
		)
	}

	const hasPets = useWatch({ control, name: 'hasPets' })

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
			<div className="space-y-1.5">
				<Label htmlFor="emergencyContactName">Emergency contact name</Label>
				<Input
					id="emergencyContactName"
					{...register('emergencyContactName')}
				/>
				<FieldError message={errors.emergencyContactName?.message} />
			</div>
			<div className="space-y-1.5">
				<Label htmlFor="emergencyContactPhone">Emergency contact phone</Label>
				<Input
					id="emergencyContactPhone"
					{...register('emergencyContactPhone')}
				/>
				<FieldError message={errors.emergencyContactPhone?.message} />
			</div>
			<div className="space-y-1.5">
				<Label htmlFor="hasPets">Pets</Label>
				<select
					id="hasPets"
					{...register('hasPets')}
					className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
				>
					<option value="">Prefer not to say</option>
					<option value="no">No pets</option>
					<option value="yes">Yes, I have pets</option>
				</select>
				<FieldError message={errors.hasPets?.message} />
			</div>
			{hasPets === 'yes' && (
				<div className="space-y-1.5">
					<Label htmlFor="petDescription">Pet description</Label>
					<Textarea
						id="petDescription"
						placeholder="e.g. 1 dog, golden retriever"
						rows={2}
						{...register('petDescription')}
					/>
					<FieldError message={errors.petDescription?.message} />
				</div>
			)}
			<div className="space-y-1.5">
				<Label htmlFor="vehicleInfo">Vehicle info</Label>
				<Input
					id="vehicleInfo"
					placeholder="e.g. 2019 Honda Civic, plate ABC-123"
					{...register('vehicleInfo')}
				/>
				<FieldError message={errors.vehicleInfo?.message} />
			</div>
			<div className="space-y-1.5">
				<Label htmlFor="notes">Notes</Label>
				<Textarea id="notes" rows={3} {...register('notes')} />
				<FieldError message={errors.notes?.message} />
			</div>
			<FormFooter
				pending={isSubmitting || update.isPending}
				onCancel={onClose}
				submitLabel="Save"
			/>
		</form>
	)
}

export function TenantProfileSection({ tenant }: { tenant: Tenant }) {
	const [editing, setEditing] = useState(false)

	return (
		<>
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<CardTitle className="text-base">Tenant profile</CardTitle>
					<Button size="sm" onClick={() => setEditing(true)}>
						Edit
					</Button>
				</CardHeader>
				<CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<ProfileField
						label="Emergency contact"
						value={tenant.emergencyContactName}
					/>
					<ProfileField
						label="Emergency phone"
						value={tenant.emergencyContactPhone}
					/>
					<ProfileField
						label="Pets"
						value={
							tenant.hasPets === true
								? tenant.petDescription
									? `Yes — ${tenant.petDescription}`
									: 'Yes'
								: tenant.hasPets === false
									? 'No'
									: null
						}
					/>
					<ProfileField label="Vehicle" value={tenant.vehicleInfo} />
					{tenant.notes && (
						<div className="sm:col-span-2">
							<ProfileField label="Notes" value={tenant.notes} />
						</div>
					)}
				</CardContent>
			</Card>
			<FormDialog
				open={editing}
				onOpenChange={setEditing}
				title="Edit tenant profile"
				description="Update your tenant profile details."
				className={FORM_DIALOG_CLASS}
			>
				<TenantProfileEditForm
					tenant={tenant}
					onClose={() => setEditing(false)}
				/>
			</FormDialog>
		</>
	)
}
