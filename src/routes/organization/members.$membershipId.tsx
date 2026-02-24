import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { BannerHeader } from '@abumble/design-system/components/BannerHeader'
import { MembershipDetailView } from '@/features/memberships'
import { useAuth } from '@/contexts/auth'

const searchSchema = z.object({
	orgId: z.string().optional(),
})

export const Route = createFileRoute('/organization/members/$membershipId')({
	validateSearch: searchSchema,
	component: RouteComponent,
})

function RouteComponent() {
	const { membershipId } = Route.useParams()
	const { orgId: searchOrgId } = Route.useSearch()
	const { user } = useAuth()

	// Default to user's first organization if orgId not in search
	const orgId = searchOrgId || user?.organizations?.[0]?.id

	if (!orgId) {
		return (
			<>
				<BannerHeader
					title="Member Profile"
					description="View and manage team member access."
				/>
				<p className="text-muted-foreground text-sm">
					No organization selected.
				</p>
			</>
		)
	}

	return (
		<>
			<BannerHeader
				title="Member Profile"
				description="Manage this member's identity and organizational permissions."
			/>

			<MembershipDetailView orgId={orgId} membershipId={membershipId} />
		</>
	)
}
