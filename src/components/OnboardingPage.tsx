import { CreateOrganizationForm } from '@/features/organizations'
import { FormCard } from '@/components/ui/FormCard'

export function OnboardingPage() {
	return (
		<div className="flex flex-1 flex-col items-center justify-center gap-8">
			<FormCard
				title="Welcome to PropMange"
				description="You're not part of an organization yet. Give yours a name and you'll be up and running in seconds."
			>
				<CreateOrganizationForm />
			</FormCard>
		</div>
	)
}
