import { CreateOrganizationForm } from '@/features/organizations'

export function OnboardingPage() {
	return (
		<div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 text-center">
			<div className="flex flex-col gap-2">
				<h1 className="text-2xl font-semibold text-foreground">
					Welcome to PropMange
				</h1>
				<p className="text-muted-foreground max-w-sm">
					You&apos;re not part of an organization yet. Give yours a name and
					you&apos;ll be up and running in seconds.
				</p>
			</div>

			<CreateOrganizationForm />
		</div>
	)
}
