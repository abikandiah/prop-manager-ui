import { createFileRoute } from '@tanstack/react-router'
import { MembershipDetailView } from '@/features/memberships'
import { useOrganization } from '@/contexts/organization'
import { CenteredEmptyState } from '@/components/CenteredEmptyState'

export const Route = createFileRoute('/_auth/_org/_dashboard/organization/members/$membershipId')({
	component: RouteComponent,
})

function RouteComponent() {
	const { membershipId } = Route.useParams()
	const { activeOrgId } = useOrganization()

	if (!activeOrgId) {
		return (
			<CenteredEmptyState
				title="No organization selected"
				description="Select an organization to view this member."
				action={null}
			/>
		)
	}

	return <MembershipDetailView membershipId={membershipId} />
}
