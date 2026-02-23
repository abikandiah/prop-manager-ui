import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { Plus } from 'lucide-react'
import { BannerHeader } from '@abumble/design-system/components/BannerHeader'
import { Button } from '@abumble/design-system/components/Button'
import {
	DialogTrigger,
	FormDialog,
} from '@abumble/design-system/components/Dialog'
import {
	PermissionTemplateForm,
	PermissionTemplatesTableView,
} from '@/features/permission-templates'
import { FORM_DIALOG_CLASS, useDialogState } from '@/lib/dialog'

const searchSchema = z.object({
	orgId: z.string().optional(),
})

export const Route = createFileRoute('/settings/permission-templates')({
	validateSearch: searchSchema,
	component: RouteComponent,
})

function RouteComponent() {
	const { orgId } = Route.useSearch()
	const dialog = useDialogState()

	if (!orgId) {
		return (
			<>
				<BannerHeader
					title="Permission Templates"
					description="Reusable permission sets for quickly granting standard access to team members."
				/>
				<p className="text-muted-foreground text-sm">
					Open this page with an <code>orgId</code> query parameter to manage
					templates for a specific organization.
				</p>
			</>
		)
	}

	return (
		<>
			<BannerHeader
				title="Permission Templates"
				description="Reusable permission sets for quickly granting standard access to team members. Templates can be system-wide or specific to your organization."
			/>

			<div>
				<FormDialog
					open={dialog.isOpen}
					onOpenChange={dialog.setIsOpen}
					title="Add permission template"
					description="Create a reusable permission set for your organization."
					className={FORM_DIALOG_CLASS}
					trigger={
						<DialogTrigger asChild>
							<Button>
								<Plus className="size-4" />
								Add template
							</Button>
						</DialogTrigger>
					}
				>
					<PermissionTemplateForm
						orgId={orgId}
						onSuccess={dialog.close}
						onCancel={dialog.close}
					/>
				</FormDialog>
			</div>

			<PermissionTemplatesTableView orgId={orgId} />
		</>
	)
}
