import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@abumble/design-system/components/Button'
import {
	LeaseTemplateFormWizard,
	LeaseTemplatesTableView,
} from '@/features/lease-templates'
import { BannerHeader } from '@abumble/design-system/components/BannerHeader'
import {
	DialogTrigger,
	FormDialog,
} from '@abumble/design-system/components/Dialog'

export const Route = createFileRoute('/leases/templates')({
	component: RouteComponent,
})

function RouteComponent() {
	const [addOpen, setAddOpen] = useState(false)
	const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1)

	const getStepTitle = (step: 1 | 2 | 3) => {
		if (step === 1) return 'Template Details'
		if (step === 2) return 'Template Parameters'
		return 'Template Content'
	}

	const handleOpenChange = (open: boolean) => {
		setAddOpen(open)
		if (!open) {
			// Reset wizard step when dialog closes
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
						when you stamp a new lease.
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
						stepTitle: getStepTitle(wizardStep),
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
