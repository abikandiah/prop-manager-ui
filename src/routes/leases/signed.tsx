import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@abumble/design-system/components/Button'
import { LeaseForm, LeasesTableView } from '@/features/leases'
import { BannerHeader, DialogTrigger, FormDialog } from '@/components/ui'

export const Route = createFileRoute('/leases/signed')({
	component: RouteComponent,
})

function RouteComponent() {
	const navigate = useNavigate()
	const [addOpen, setAddOpen] = useState(false)
	return (
		<>
			<BannerHeader
				title="Signed Leases"
				description={
					<>
						View and manage all active, expired, and terminated lease
						agreements. These are leases that have been signed by tenants and
						are in effect or have completed their term.
					</>
				}
			/>

			<div>
				<FormDialog
					open={addOpen}
					onOpenChange={setAddOpen}
					title="Add signed lease"
					description="Create a new signed lease agreement."
					trigger={
						<DialogTrigger asChild>
							<Button>
								<Plus className="size-4" />
								Add lease
							</Button>
						</DialogTrigger>
					}
				>
					<LeaseForm
						onSuccess={(data) => {
							setAddOpen(false)
							if (data)
								navigate({
									to: '/leases/$leaseId',
									params: { leaseId: data.id },
								})
						}}
						onCancel={() => setAddOpen(false)}
						submitLabel="Create Lease"
					/>
				</FormDialog>
			</div>

			<LeasesTableView status="ACTIVE" />
		</>
	)
}
