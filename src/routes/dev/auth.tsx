import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { DevAuthForm } from '@/components/DevAuthForm'

export const Route = createFileRoute('/dev/auth')({
	component: DevAuth,
})

function DevAuth() {
	const navigate = useNavigate()

	return (
		<div className="flex flex-col items-center justify-center flex-1 gap-12 px-4 py-12 min-h-[60vh]">
			<DevAuthForm onSuccess={() => navigate({ to: '/' })} wrappedInCard />
		</div>
	)
}
