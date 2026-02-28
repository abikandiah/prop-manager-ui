import { useCallback, useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { z } from 'zod'
import { toast } from 'sonner'
import { Check } from 'lucide-react'
import { Button } from '@abumble/design-system/components/Button'
import { DialogFooter } from '@abumble/design-system/components/Dialog'
import { usePermissionTemplateDetail } from '@/features/permission-templates'
import { useMembershipById } from '@/features/memberships'
import { useCreateMemberScope } from '@/features/member-scopes/hooks'
import { scopeConfigSchema } from '@/features/member-scopes/schemas'
import { ScopeConfigurator } from '../ScopeConfigurator'
import type { ScopeConfigValue, ScopeType } from '@/domain/member-scope'
import { getTemplatePermissions } from '@/features/member-scopes/utils'

type FormValues = {
	config: ScopeConfigValue
}

// ---------- Props ----------

export interface CreateScopeFormProps {
	/** The org the membership belongs to. */
	orgId: string
	/** The membership to add the scope to. */
	membershipId: string
	onSuccess?: () => void
	onCancel?: () => void
}

// ---------- Component ----------

export function CreateScopeForm({
	orgId,
	membershipId,
	onSuccess,
	onCancel,
}: CreateScopeFormProps) {
	const createScope = useCreateMemberScope()

	// Fetch membership to get its primary template for inherited permissions preview
	const { data: membership } = useMembershipById(orgId, membershipId)
	const { data: mainTemplate } = usePermissionTemplateDetail(
		membership?.membershipTemplateId ?? null
	)

	const {
		control,
		handleSubmit,
		watch,
		formState: { errors },
	} = useForm<FormValues>({
		resolver: standardSchemaResolver(z.object({ config: scopeConfigSchema })),
		defaultValues: {
			config: {
				scopeType: 'ORG',
				scopeId: '',
				useTemplate: true,
				templateId: '',
				permissions: {},
			},
		},
		mode: 'onTouched',
	})

	const currentConfig = watch('config')
	const inheritedPermissions = useMemo(() => {
		return getTemplatePermissions(mainTemplate, currentConfig.scopeType)
	}, [mainTemplate, currentConfig.scopeType])

	const onSubmit = useCallback(
		(values: FormValues) => {
			const { config } = values
			const resolvedScopeId =
				config.scopeType === 'ORG' ? orgId : config.scopeId.trim()

			createScope.mutate(
				{
					orgId,
					membershipId,
					payload: {
						scopeType: config.scopeType as ScopeType,
						scopeId: resolvedScopeId,
						permissions: config.useTemplate ? undefined : config.permissions,
						templateId: config.useTemplate ? config.templateId : undefined,
					},
				},
				{
					onSuccess: () => {
						toast.success('Scope added')
						onSuccess?.()
					},
				},
			)
		},
		[orgId, membershipId, createScope, onSuccess],
	)

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-4">
			<Controller
				name="config"
				control={control}
				render={({ field }) => (
					<ScopeConfigurator
						orgId={orgId}
						value={field.value}
						onChange={field.onChange}
						globalInheritedPermissions={inheritedPermissions}
						errors={{
							scopeType: errors.config?.scopeType as { message?: string },
							scopeId: errors.config?.scopeId as { message?: string },
							templateId: errors.config?.templateId as { message?: string },
							permissions: errors.config?.permissions as { message?: string },
						}}
					/>
				)}
			/>

			<DialogFooter className="gap-2">
				{onCancel && (
					<Button type="button" variant="outline" onClick={onCancel}>
						Cancel
					</Button>
				)}
				<Button type="submit" disabled={createScope.isPending}>
					{createScope.isPending ? (
						'Saving…'
					) : (
						<>
							<Check className="h-4 w-4" />
							Add scope
						</>
					)}
				</Button>
			</DialogFooter>
		</form>
	)
}
