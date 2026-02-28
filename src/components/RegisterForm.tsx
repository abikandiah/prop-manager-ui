import { api, getDevToken } from '@/api/client'
import { DevAuthForm } from '@/components/DevAuthForm'
import { TextLink } from '@/components/ui'
import { FormActions, FormCard } from '@/components/ui/FormCard'
import { config } from '@/config'
import { useAuth, type User } from '@/contexts/auth'
import { Button } from '@abumble/design-system/components/Button'
import { Checkbox } from '@abumble/design-system/components/Checkbox'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'

interface RegisterFormProps {
	title?: React.ReactNode
	description?: React.ReactNode
}

export function RegisterForm({
	title = 'Accept terms to continue',
	description = 'Please read and accept the Terms of Service and Privacy Policy before continuing.',
}: RegisterFormProps) {
	const { refreshUser } = useAuth()

	const [agreedToTermsAndPrivacy, setAgreedToTermsAndPrivacy] = useState(false)
	const [hasDevToken, setHasDevToken] = useState(() => !!getDevToken())

	const isDevNoToken = config.isDevelopment && !hasDevToken

	const acceptTermsMutation = useMutation({
		mutationFn: () => api.patch<User>('/me', { termsAccepted: true }),
		onSuccess: async () => {
			toast.success('Terms accepted. Welcome!')
			refreshUser()
		},
	})

	const onDevAuthSuccess = () => {
		setHasDevToken(true)
		refreshUser()
	}

	const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
		e.preventDefault()
		if (!agreedToTermsAndPrivacy) {
			toast.error(
				'Please accept the Terms of Service and Privacy Policy to continue.',
			)
			return
		}
		acceptTermsMutation.mutate()
	}

	if (isDevNoToken) {
		return <DevAuthForm onSuccess={onDevAuthSuccess} wrappedInCard={true} />
	}

	return (
		<FormCard title={title} description={description}>
			<form onSubmit={handleSubmit} className="space-y-6">
				<div className="flex items-start gap-3">
					<Checkbox
						id="register-agreement"
						checked={agreedToTermsAndPrivacy}
						onCheckedChange={(checked) => setAgreedToTermsAndPrivacy(!!checked)}
						aria-describedby="register-agreement-desc"
					/>
					<label
						className="text-sm font-normal -mt-0.5 text-foreground"
						htmlFor="register-agreement"
					>
						I've read and agree to the{' '}
						<TextLink
							to="/public/terms"
							target="_blank"
							rel="noopener noreferrer"
							className="text-foreground underline underline-offset-2"
						>
							Terms of Service
						</TextLink>{' '}
						and{' '}
						<TextLink
							to="/public/privacy"
							target="_blank"
							rel="noopener noreferrer"
							className="text-foreground underline underline-offset-2"
						>
							Privacy Policy
						</TextLink>
						.
					</label>
				</div>

				<FormActions>
					<Button
						type="submit"
						disabled={acceptTermsMutation.isPending || !agreedToTermsAndPrivacy}
						aria-busy={acceptTermsMutation.isPending}
					>
						{acceptTermsMutation.isPending ? 'Accepting...' : 'I accept'}
					</Button>
				</FormActions>
			</form>
		</FormCard>
	)
}
