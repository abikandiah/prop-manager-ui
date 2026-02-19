import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { Button } from '@abumble/design-system/components/Button'
import { DialogFooter } from '@abumble/design-system/components/Dialog'
import { Input } from '@abumble/design-system/components/Input'
import { Label } from '@abumble/design-system/components/Label'
import { Select } from '@abumble/design-system/components/Select'
import { Plus, Trash2 } from 'lucide-react'
import { useFieldArray, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { LEASE_TENANT_ROLES, LeaseTenantRole } from '@/domain/lease-tenant'
import { FieldError } from '@/components/ui/FieldError'
import { formatEnumLabel } from '@/lib/format'
import { useInviteLeaseTenants } from '@/features/leases/hooks'

// ---------- Schema ----------

const inviteRowSchema = z.object({
	email: z.email({ error: 'Enter a valid email address' }),
	role: z.enum([LeaseTenantRole.PRIMARY, LeaseTenantRole.OCCUPANT], {
		error: 'Role is required',
	}),
})

const inviteFormSchema = z.object({
	invites: z.array(inviteRowSchema).min(1),
})

type InviteFormValues = z.infer<typeof inviteFormSchema>

const DEFAULT_ROW = { email: '', role: LeaseTenantRole.PRIMARY } as const

// ---------- Component ----------

export interface InviteTenantsFormProps {
	leaseId: string
	onSuccess: () => void
	onCancel: () => void
}

/**
 * Multi-row form for inviting one or more tenants to a DRAFT lease.
 * Each row collects an email address and role (Primary / Occupant).
 * Renders inside a FormDialog — caller is responsible for the dialog wrapper.
 */
export function InviteTenantsForm({
	leaseId,
	onSuccess,
	onCancel,
}: InviteTenantsFormProps) {
	const inviteTenants = useInviteLeaseTenants()

	const {
		register,
		control,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<InviteFormValues>({
		resolver: standardSchemaResolver(inviteFormSchema),
		defaultValues: { invites: [{ ...DEFAULT_ROW }] },
		mode: 'onTouched',
	})

	const { fields, append, remove } = useFieldArray({
		control,
		name: 'invites',
	})

	const isPending = inviteTenants.isPending || isSubmitting

	const onSubmit = (values: InviteFormValues) => {
		inviteTenants.mutate(
			{ leaseId, payload: { invites: values.invites } },
			{
				onSuccess: (created) => {
					const count = created.length
					toast.success(
						count === 1 ? 'Invitation sent' : `${count} invitations sent`,
					)
					onSuccess()
				},
			},
		)
	}

	return (
		<form onSubmit={handleSubmit(onSubmit)} noValidate>
			<div className="space-y-4 mt-4">
				{/* Table */}
				<div className="rounded-lg border overflow-hidden">
					{/* Header */}
					<div className="grid grid-cols-[1fr_148px_36px] gap-3 border-b bg-muted/50 px-3 py-2">
						<p className="text-xs font-medium text-muted-foreground">Email</p>
						<p className="text-xs font-medium text-muted-foreground">Role</p>
						<span />
					</div>

					{/* Rows */}
					<div className="divide-y">
						{fields.map((field, index) => (
							<div
								key={field.id}
								className="grid grid-cols-[1fr_148px_36px] items-start gap-3 px-3 py-2.5"
							>
								{/* Email */}
								<div className="space-y-1">
									<Label htmlFor={`invites.${index}.email`} className="sr-only">
										Email for person {index + 1}
									</Label>
									<Input
										id={`invites.${index}.email`}
										{...register(`invites.${index}.email`)}
										type="email"
										placeholder="tenant@example.com"
										autoComplete="off"
									/>
									<FieldError
										message={errors.invites?.[index]?.email?.message}
									/>
								</div>

								{/* Role */}
								<div className="space-y-1">
									<Label htmlFor={`invites.${index}.role`} className="sr-only">
										Role for person {index + 1}
									</Label>
									<Select
										id={`invites.${index}.role`}
										{...register(`invites.${index}.role`)}
									>
										{LEASE_TENANT_ROLES.map((r) => (
											<option key={r} value={r}>
												{formatEnumLabel(r)}
											</option>
										))}
									</Select>
									<FieldError
										message={errors.invites?.[index]?.role?.message}
									/>
								</div>

								{/* Remove */}
								<div className="flex items-center pt-0.5">
									<Button
										type="button"
										variant="ghost"
										size="icon"
										className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
										onClick={() => remove(index)}
										disabled={fields.length === 1}
										aria-label={`Remove person ${index + 1}`}
									>
										<Trash2 className="size-4" />
									</Button>
								</div>
							</div>
						))}
					</div>

					{/* Add row */}
					<div className="border-t px-3 py-2">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="h-8 text-muted-foreground hover:text-foreground"
							onClick={() => append({ ...DEFAULT_ROW })}
							disabled={isPending}
						>
							<Plus className="size-4" />
							Add another person
						</Button>
					</div>
				</div>

				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={onCancel}
						disabled={isPending}
					>
						Cancel
					</Button>
					<Button type="submit" disabled={isPending}>
						{isPending
							? 'Sending…'
							: fields.length === 1
								? 'Send invite'
								: `Send ${fields.length} invites`}
					</Button>
				</DialogFooter>
			</div>
		</form>
	)
}
