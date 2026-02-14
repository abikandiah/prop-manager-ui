import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@abumble/design-system/components/Button'
import { LeaseForm, LeasesTableView } from '@/features/leases'
import { BannerHeader, DialogTrigger, FormDialog } from '@/components/ui'

export const Route = createFileRoute('/leases/agreements')({
	component: RouteComponent,
})

function RouteComponent() {
	const navigate = useNavigate()
	const [addOpen, setAddOpen] = useState(false)
	return (
		<>
			<BannerHeader
				title="Lease Agreements"
				description="Create and manage lease agreements that connect tenants to your properties and units. Track active, expired, and past leases."
			/>

			<div>
				<FormDialog
					open={addOpen}
					onOpenChange={setAddOpen}
					title="Add lease agreement"
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
