import { FieldError, FormFooter } from '@/components/ui'
import type { Tenant } from '@/domain/tenant'
import { useUpdateMyTenantProfile } from '@/features/tenant-portal/hooks'
import { Input } from '@abumble/design-system/components/Input'
import { Label } from '@abumble/design-system/components/Label'
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '@abumble/design-system/components/Card'
import { Button } from '@abumble/design-system/components/Button'
import { FormDialog } from '@abumble/design-system/components/Dialog'
import { Textarea } from '@abumble/design-system/components/Textarea'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { FORM_DIALOG_CLASS_WIDE } from '@/lib/dialog'

const schema = z.object({
	emergencyContactName: z.string().max(255).optional(),
	emergencyContactPhone: z.string().max(50).optional(),
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
		formState: { errors, isSubmitting },
	} = useForm<FormValues>({
		resolver: standardSchemaResolver(schema),
		defaultValues: {
			emergencyContactName: tenant.emergencyContactName ?? '',
			emergencyContactPhone: tenant.emergencyContactPhone ?? '',
			hasPets: tenant.hasPets === true ? 'yes' : tenant.hasPets === false ? 'no' : '',
			petDescription: tenant.petDescription ?? '',
			vehicleInfo: tenant.vehicleInfo ?? '',
			notes: tenant.notes ?? '',
		},
	})

	function onSubmit(values: FormValues) {
		update.mutate(
			{
				emergencyContactName: values.emergencyContactName || null,
				emergencyContactPhone: values.emergencyContactPhone || null,
				hasPets: values.hasPets === 'yes' ? true : values.hasPets === 'no' ? false : null,
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

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
			<div className="space-y-1.5">
				<Label htmlFor="emergencyContactName">Emergency contact name</Label>
				<Input id="emergencyContactName" {...register('emergencyContactName')} />
				<FieldError error={errors.emergencyContactName} />
			</div>
			<div className="space-y-1.5">
				<Label htmlFor="emergencyContactPhone">Emergency contact phone</Label>
				<Input id="emergencyContactPhone" {...register('emergencyContactPhone')} />
				<FieldError error={errors.emergencyContactPhone} />
			</div>
			<div className="space-y-1.5">
				<Label htmlFor="vehicleInfo">Vehicle info</Label>
				<Input id="vehicleInfo" placeholder="e.g. 2019 Honda Civic, plate ABC-123" {...register('vehicleInfo')} />
				<FieldError error={errors.vehicleInfo} />
			</div>
			<div className="space-y-1.5">
				<Label htmlFor="notes">Notes</Label>
				<Textarea id="notes" rows={3} {...register('notes')} />
				<FieldError error={errors.notes} />
			</div>
			<FormFooter>
				<Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
				<Button type="submit" disabled={isSubmitting || update.isPending}>Save</Button>
			</FormFooter>
		</form>
	)
}

function ProfileField({ label, value }: { label: string; value: string | null | undefined }) {
	return (
		<div className="flex flex-col gap-0.5">
			<span className="text-xs text-muted-foreground">{label}</span>
			<span className="text-sm text-foreground">{value || '—'}</span>
		</div>
	)
}

export function TenantProfileSection({ tenant }: { tenant: Tenant }) {
	const [editing, setEditing] = useState(false)

	return (
		<>
			<Card>
				<CardHeader className="px-5 pb-3 flex flex-row items-center justify-between">
					<CardTitle className="text-base">Tenant profile</CardTitle>
					<Button variant="outline" size="sm" onClick={() => setEditing(true)}>
						Edit
					</Button>
				</CardHeader>
				<CardContent className="px-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
					<ProfileField label="Emergency contact" value={tenant.emergencyContactName} />
					<ProfileField label="Emergency phone" value={tenant.emergencyContactPhone} />
					<ProfileField label="Pets" value={
						tenant.hasPets === true ? (tenant.petDescription ? `Yes — ${tenant.petDescription}` : 'Yes') :
						tenant.hasPets === false ? 'No' : null
					} />
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
				className={FORM_DIALOG_CLASS_WIDE}
			>
				<TenantProfileEditForm tenant={tenant} onClose={() => setEditing(false)} />
			</FormDialog>
		</>
	)
}
