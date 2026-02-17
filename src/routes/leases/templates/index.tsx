import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@abumble/design-system/components/Button'
import { BannerHeader } from '@abumble/design-system/components/BannerHeader'
import {
	DialogTrigger,
	FormDialog,
} from '@abumble/design-system/components/Dialog'
import {
	LEASE_TEMPLATE_WIZARD_STEPS,
	LeaseTemplateFormWizard,
	LeaseTemplatesTableView,
} from '@/features/lease-templates'

export const Route = createFileRoute('/leases/templates/')({
	component: RouteComponent,
})

function RouteComponent() {
	const [addOpen, setAddOpen] = useState(false)
	const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1)

	const handleOpenChange = (open: boolean) => {
		setAddOpen(open)
		if (!open) {
			setWizardStep(1)
		}
	}

	return (
		<>
			<BannerHeader
				title="Lease Templates"
				description={
					<>
						Create and manage lease templates that can be used as starting
						points for new tenant agreements. Templates let you define standard
						terms, conditions, and clauses with placeholders that get filled in
						when you start a new lease agreement.
					</>
				}
			/>

			<div>
				<FormDialog
					open={addOpen}
					onOpenChange={handleOpenChange}
					title="Add lease template"
					description="Create a new reusable lease template with standard terms."
					className="max-w-[calc(100vw-2rem)] sm:max-w-5xl"
					wizard={{
						currentStep: wizardStep,
						totalSteps: 3,
						stepTitle: LEASE_TEMPLATE_WIZARD_STEPS[wizardStep],
						stepLabels: ['Details', 'Parameters', 'Content'],
					}}
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
						step={wizardStep}
						onStepChange={setWizardStep}
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
