export function OnboardingPage() {
	return (
		<div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
			<div className="flex flex-col gap-2">
				<h1 className="text-2xl font-semibold text-foreground">
					Welcome to PropMange
				</h1>
				<p className="text-muted-foreground max-w-sm">
					You don&apos;t belong to any organization yet. Create your first one
					to get started.
				</p>
			</div>
			{/* TODO Phase 3: wire up CreateOrganizationForm here */}
		</div>
	)
}
