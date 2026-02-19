import { LeaseAgreementFormWizard, LeasesTableView } from '@/features/leases'
import { BannerHeader } from '@abumble/design-system/components/BannerHeader'
import { Button } from '@abumble/design-system/components/Button'
import {
	DialogTrigger,
	FormDialog,
} from '@abumble/design-system/components/Dialog'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { useState } from 'react'

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
				title="Lease Agreements"
				description="Create and manage lease agreements that connect tenants to properties and units. Track active, expired, and past leases."
			/>

			<div>
				<FormDialog
					open={addOpen}
					onOpenChange={handleOpenChange}
					title="Add lease agreement"
					description="Create a new signed lease agreement."
					className="max-w-[calc(100vw-2rem)] sm:max-w-5xl"
					wizard={{
						currentStep: wizardStep,
						totalSteps: 3,
						stepTitle: WIZARD_STEP_TITLES[wizardStep],
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
						step={wizardStep}
						onStepChange={setWizardStep}
						onSuccess={(lease) => {
							setAddOpen(false)
							navigate({
								to: '/leases/agreements/$leaseId',
								params: { leaseId: lease.id },
							})
						}}
						onCancel={() => setAddOpen(false)}
						submitLabel="Create Lease"
					/>
				</FormDialog>
			</div>

			<LeasesTableView />
		</>
	)
}
