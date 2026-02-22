import { api, getDevToken } from '@/api/client'
import { DevAuthForm } from '@/components/DevAuthForm'
import { TextLink } from '@/components/ui'
import { config } from '@/config'
import type { User } from '@/contexts/auth'
import { Button } from '@abumble/design-system/components/Button'
import { Checkbox } from '@abumble/design-system/components/Checkbox'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'

interface RegisterFormProps {
	onSuccess: () => void | Promise<unknown>
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
	const [agreedToTermsAndPrivacy, setAgreedToTermsAndPrivacy] = useState(false)
	const [hasDevToken, setHasDevToken] = useState(() => !!getDevToken())

	const isDevNoToken = config.isDevelopment && !hasDevToken

	const acceptTermsMutation = useMutation({
		mutationFn: () => api.patch<User>('/me', { termsAccepted: true }),
		onSuccess: () => {
			toast.success('Terms accepted. Welcome!')
			onSuccess()
		},
	})

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
		return (
			<DevAuthForm
				onSuccess={() => setHasDevToken(true)}
				wrappedInCard={false}
			/>
		)
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
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

			<Button
				type="submit"
				className="w-full"
				disabled={acceptTermsMutation.isPending || !agreedToTermsAndPrivacy}
				aria-busy={acceptTermsMutation.isPending}
			>
				{acceptTermsMutation.isPending ? 'Accepting...' : 'I accept'}
			</Button>
		</form>
	)
}
