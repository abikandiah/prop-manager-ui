import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { PropsForm, PropsTableView } from '@/features/props/components'
import { BannerHeader } from '@/components/ui'
import { Button } from '@abumble/design-system/components/Button'
import { DialogTrigger, FormDialog } from '@/components/ui'

export const Route = createFileRoute('/props/')({
	component: RouteComponent,
})

function RouteComponent() {
	const navigate = useNavigate()
	const [addOpen, setAddOpen] = useState(false)
	return (
		<>
			<BannerHeader
				title="Properties"
				description={
					<>
						This is where you keep a list of every property you own or
						manage—your house, a rental building, a commercial space, or a piece
						of land. Add each one with its address and a few details; later you
						can attach units and tenants to them.
					</>
				}
				breadcrumbItems={[{ label: 'Properties' }]}
			/>

			<div>
				<FormDialog
					open={addOpen}
					onOpenChange={setAddOpen}
					title="Add Property"
					description="Enter the legal name, address, and property details."
					trigger={
						<DialogTrigger asChild>
							<Button>
								<Plus className="size-4" />
								Add Property
							</Button>
						</DialogTrigger>
					}
				>
					<PropsForm
						onSuccess={(data) => {
							setAddOpen(false)
							if (data)
								navigate({ to: '/props/$id', params: { id: data.id } })
						}}
						onCancel={() => setAddOpen(false)}
						submitLabel="Create Property"
					/>
				</FormDialog>
			</div>

			<PropsTableView />
		</>
	)
}
