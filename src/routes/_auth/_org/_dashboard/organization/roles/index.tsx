import { useAuth } from '@/features/auth'
import {
	PermissionPoliciesTableView,
	PermissionPolicyForm,
} from '@/features/permission-policies'
import { FORM_DIALOG_CLASS, useDialogState } from '@/lib/dialog'
import { BannerHeader } from '@abumble/design-system/components/BannerHeader'
import { Button } from '@abumble/design-system/components/Button'
import {
	DialogTrigger,
	FormDialog,
} from '@abumble/design-system/components/Dialog'
import { createFileRoute } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { z } from 'zod'

const searchSchema = z.object({
	orgId: z.string().optional(),
})

export const Route = createFileRoute(
	'/_auth/_org/_dashboard/organization/roles/',
)({
	validateSearch: searchSchema,
	component: RouteComponent,
})

function RouteComponent() {
	const { orgId: searchOrgId } = Route.useSearch()
	const { user } = useAuth()
	const dialog = useDialogState()

	// Default to user's first organization if orgId not in search
	const orgId = searchOrgId || user?.organizations?.[0]?.id

	if (!orgId) {
		return (
			<>
				<BannerHeader
					title="Team Roles"
					description="Reusable permission sets for quickly granting standard access to team members."
				/>
				<p className="text-muted-foreground text-sm">
					No organization selected. Please ensure you are logged in and belong
					to an organization.
				</p>
			</>
		)
	}

	return (
		<>
			<BannerHeader
				title="Team Roles"
				description="Manage reusable permission sets (roles) for your organization. Roles can be system-wide or specific to your organization."
			/>

			<div>
				<FormDialog
					open={dialog.isOpen}
					onOpenChange={dialog.setIsOpen}
					title="Add role"
					description="Create a reusable permission set for your team."
					className={FORM_DIALOG_CLASS}
					trigger={
						<DialogTrigger asChild>
							<Button>
								<Plus className="size-4" />
								Add role
							</Button>
						</DialogTrigger>
					}
				>
					<PermissionPolicyForm
						orgId={orgId}
						onSuccess={dialog.close}
						onCancel={dialog.close}
					/>
				</FormDialog>
			</div>

			<PermissionPoliciesTableView orgId={orgId} />
		</>
	)
}
