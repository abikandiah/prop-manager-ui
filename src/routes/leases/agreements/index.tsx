import { LeaseAgreementFormWizard, LeasesTableView } from '@/features/leases'
import { BannerHeader } from '@abumble/design-system/components/BannerHeader'
import { Button } from '@abumble/design-system/components/Button'
import {
	DialogTrigger,
	FormDialog,
} from '@abumble/design-system/components/Dialog'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { FORM_DIALOG_CLASS_WIDE, useWizardDialogState } from '@/lib/dialog'

export const Route = createFileRoute('/leases/agreements/')({
	component: RouteComponent,
})

const WIZARD_STEP_TITLES: Record<1 | 2 | 3, string> = {
	1: 'Details',
	2: 'Terms',
	3: 'Parameters',
}

function RouteComponent() {
	const navigate = useNavigate()
	const wizard = useWizardDialogState()

	return (
		<>
			<BannerHeader
				title="Lease Agreements"
				description="Create and manage lease agreements that connect tenants to properties and units. Track active, expired, and past leases."
			/>

			<div>
				<FormDialog
					open={wizard.isOpen}
					onOpenChange={wizard.handleOpenChange}
					title="Add lease agreement"
					description="Create a new signed lease agreement."
					className={FORM_DIALOG_CLASS_WIDE}
					wizard={{
						currentStep: wizard.step,
						totalSteps: 3,
						stepTitle: WIZARD_STEP_TITLES[wizard.step],
						stepLabels: ['Details', 'Terms', 'Parameters'],
					}}
					trigger={
						<DialogTrigger asChild>
							<Button>
								<Plus className="size-4" />
								Add lease
							</Button>
						</DialogTrigger>
					}
				>
					<LeaseAgreementFormWizard
						step={wizard.step}
						onStepChange={wizard.setStep}
						onSuccess={(lease) => {
							wizard.close()
							navigate({
								to: '/leases/agreements/$leaseId',
								params: { leaseId: lease.id },
							})
						}}
						onCancel={wizard.close}
						submitLabel="Create Lease"
					/>
				</FormDialog>
			</div>

			<LeasesTableView />
		</>
	)
}
