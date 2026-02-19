import { createFileRoute } from '@tanstack/react-router'
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
import { FORM_DIALOG_CLASS_WIDE, useWizardDialogState } from '@/lib/dialog'

export const Route = createFileRoute('/leases/templates/')({
	component: RouteComponent,
})

function RouteComponent() {
	const wizard = useWizardDialogState()

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
					open={wizard.isOpen}
					onOpenChange={wizard.handleOpenChange}
					title="Add lease template"
					description="Create a new reusable lease template with standard terms."
					className={FORM_DIALOG_CLASS_WIDE}
					wizard={{
						currentStep: wizard.step,
						totalSteps: 3,
						stepTitle: LEASE_TEMPLATE_WIZARD_STEPS[wizard.step],
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
						step={wizard.step}
						onStepChange={wizard.setStep}
						onSuccess={wizard.close}
						onCancel={wizard.close}
						submitLabel="Create Template"
					/>
				</FormDialog>
			</div>

			<LeaseTemplatesTableView />
		</>
	)
}
