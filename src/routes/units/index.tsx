import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@abumble/design-system/components/Button'
import { BannerHeader } from '@abumble/design-system/components/BannerHeader'
import {
	DialogTrigger,
	FormDialog,
} from '@abumble/design-system/components/Dialog'
import { UnitForm, UnitsTableView } from '@/features/units'

export const Route = createFileRoute('/units/')({
	component: UnitsPage,
})

function UnitsPage() {
	const [addOpen, setAddOpen] = useState(false)
	return (
		<div className="space-y-6">
			<BannerHeader
				title="Units"
				description="Manage all units across your properties. Add new units, update their status, or view details."
			/>

			<div>
				<FormDialog
					open={addOpen}
					onOpenChange={setAddOpen}
					title="Add unit"
					description="Select a property and enter the unit details."
					trigger={
						<DialogTrigger asChild>
							<Button>
								<Plus className="size-4" />
								Add unit
							</Button>
						</DialogTrigger>
					}
				>
					<UnitForm
						onSuccess={() => setAddOpen(false)}
						onCancel={() => setAddOpen(false)}
						submitLabel="Create Unit"
					/>
				</FormDialog>
			</div>

			<UnitsTableView />
		</div>
	)
}
