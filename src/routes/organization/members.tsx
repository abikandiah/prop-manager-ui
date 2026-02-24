import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { UserPlus } from 'lucide-react'
import { BannerHeader } from '@abumble/design-system/components/BannerHeader'
import { Button } from '@abumble/design-system/components/Button'
import {
	DialogTrigger,
	FormDialog,
} from '@abumble/design-system/components/Dialog'
import { MembershipsTableView } from '@/features/memberships'
import { InviteMemberForm } from '@/features/invites/components/forms/InviteMemberForm'
import { FORM_DIALOG_CLASS, useDialogState } from '@/lib/dialog'
import { useAuth } from '@/contexts/auth'

const searchSchema = z.object({
	orgId: z.string().optional(),
})

export const Route = createFileRoute('/organization/members')({
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
					title="Team Members"
					description="Manage your organization's members and their access levels."
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
				title="Team Members"
				description="Manage your team, invite new members, and control their permissions."
			/>

			<div>
				<FormDialog
					open={dialog.isOpen}
					onOpenChange={dialog.setIsOpen}
					title="Invite team member"
					description="Send an invitation to join your organization."
					className={FORM_DIALOG_CLASS}
					trigger={
						<DialogTrigger asChild>
							<Button>
								<UserPlus className="size-4" />
								Invite member
							</Button>
						</DialogTrigger>
					}
				>
					<InviteMemberForm
						orgId={orgId}
						onSuccess={dialog.close}
						onCancel={dialog.close}
					/>
				</FormDialog>
			</div>

			<MembershipsTableView orgId={orgId} />
		</>
	)
}
