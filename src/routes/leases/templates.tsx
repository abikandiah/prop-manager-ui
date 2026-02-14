import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@abumble/design-system/components/Button'
import {
	LeaseTemplateFormWizard,
	LeaseTemplatesTableView,
} from '@/features/lease-templates'
import { BannerHeader, DialogTrigger, FormDialog } from '@/components/ui'

export const Route = createFileRoute('/leases/templates')({
	component: RouteComponent,
})

function RouteComponent() {
	const [addOpen, setAddOpen] = useState(false)
	return (
		<>
			<BannerHeader
				title="Lease Templates"
				description={
					<>
						Create and manage lease templates that can be used as starting
						points for new tenant agreements. Templates let you define standard
						terms, conditions, and clauses with placeholders that get filled in
						when you stamp a new lease.
					</>
				}
			/>

			<div>
				<FormDialog
					open={addOpen}
					onOpenChange={setAddOpen}
					title="Add lease template"
					description="Create a new reusable lease template with standard terms."
					className="max-w-[calc(100vw-2rem)] sm:max-w-5xl"
					trigger={
						<DialogTrigger asChild>
							<Button>
								<Plus className="size-4" />
								Add template
							</Button>
						</DialogTrigger>
					}
				>
					<LeaseTemplateFormWizard
						onSuccess={() => setAddOpen(false)}
						onCancel={() => setAddOpen(false)}
						submitLabel="Create Template"
					/>
				</FormDialog>
			</div>

			<LeaseTemplatesTableView />
		</>
	)
}
