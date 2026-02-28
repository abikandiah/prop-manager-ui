import { useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { z } from 'zod'
import { toast } from 'sonner'
import { Building2 } from 'lucide-react'
import { Button } from '@abumble/design-system/components/Button'
import { Input } from '@abumble/design-system/components/Input'
import { Label } from '@abumble/design-system/components/Label'
import { FieldError } from '@/components/ui/FieldError'
import { RequiredMark } from '@/components/ui'
import { FormActions } from '@/components/ui/FormCard'
import { useCreateOrganization } from '@/features/organizations'

const createOrganizationSchema = z.object({
	name: z
		.string()
		.min(2, 'Name must be at least 2 characters')
		.max(100, 'Name must be 100 characters or fewer'),
})

type CreateOrganizationFormValues = z.infer<typeof createOrganizationSchema>

export interface CreateOrganizationFormProps {
	onSuccess?: () => void
}

/**
 * Inline form for creating a new organization during onboarding.
 */
export function CreateOrganizationForm({
	onSuccess,
}: CreateOrganizationFormProps) {
	const createOrganization = useCreateOrganization()

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<CreateOrganizationFormValues>({
		resolver: standardSchemaResolver(createOrganizationSchema),
		defaultValues: { name: '' },
		mode: 'onTouched',
	})

	const onSubmit = useCallback(
		(values: CreateOrganizationFormValues) => {
			createOrganization.mutate(
				{ name: values.name },
				{
					onSuccess: () => {
						toast.success('Organization created')
						onSuccess?.()
					},
				},
			)
		},
		[createOrganization, onSuccess],
	)

	return (
		<form
			onSubmit={handleSubmit(onSubmit)}
			className="w-full max-w-sm space-y-5"
			aria-label="Create organization"
		>
			<div className="space-y-2">
				<Label htmlFor="org-name">
					Organization name <RequiredMark />
				</Label>
				<Input
					id="org-name"
					placeholder="e.g. Acme Properties"
					autoComplete="organization"
					autoFocus
					{...register('name')}
				/>
				<FieldError message={errors.name?.message} />
			</div>

			<FormActions>
				<Button type="submit" disabled={createOrganization.isPending}>
					{createOrganization.isPending ? (
						'Creating…'
					) : (
						<>
							<Building2 className="h-4 w-4" />
							Create organization
						</>
					)}
				</Button>
			</FormActions>
		</form>
	)
}
