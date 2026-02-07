import { MessageBanner } from '@abumble/design-system/components/Banner'
import { Button } from '@abumble/design-system/components/Button'
import {
	Card,
	CardContent,
	CardHeader,
} from '@abumble/design-system/components/Card'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import type { User } from '@/contexts/auth'
import { Checkbox } from '@/components/ui/checkbox'
import { TextLink } from '@/components/ui'
import { api } from '@/api/client'

export const Register = () => {
	const [agreedToTermsAndPrivacy, setAgreedToTermsAndPrivacy] = useState(false)
	const queryClient = useQueryClient()

	const registerMutation = useMutation({
		mutationFn: () => api.post<User>('/register', {}),
		onSuccess: (response) => {
			const user = response.data
			queryClient.setQueryData(['me'], user)
			toast.success('Account created successfully.')
		},
	})

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		if (!agreedToTermsAndPrivacy) {
			toast.error(
				'Please accept the Terms of Service and Privacy Policy to continue.',
			)
			return
		}
		registerMutation.mutate()
	}

	return (
		<div className="flex flex-1 flex-col justify-center items-center px-4 py-8">
			<MessageBanner
				type="info"
				message="This is a dev project. It is not intended for business or commercial use.
				 No warranty or support is provided. Use at risk."
				className="mb-4 w-full max-w-md rounded"
			/>

			<Card className="w-full max-w-md">
				<CardHeader className="space-y-1">
					<h1 className="text-2xl font-semibold text-foreground">
						Create account
					</h1>
					<p className="text-sm text-muted-foreground">
						By creating an account, you agree to the following. Please read and
						accept before continuing.
					</p>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-6">
						<div className="flex items-start gap-3">
							<Checkbox
								id="agreement"
								checked={agreedToTermsAndPrivacy}
								onCheckedChange={(checked) =>
									setAgreedToTermsAndPrivacy(!!checked)
								}
								aria-describedby="agreement-desc"
							/>

							<label className="text-sm font-normal -mt-0.5">
								By checking this box, you agree to our{' '}
								<TextLink
									to="/public/terms"
									target="_blank"
									rel="noopener noreferrer"
									className="text-foreground underline-offset-2 hover:underline"
								>
									Terms of Service
								</TextLink>{' '}
								and acknowledge our{' '}
								<TextLink
									to="/public/privacy"
									target="_blank"
									rel="noopener noreferrer"
									className="text-foreground underline-offset-2 hover:underline"
								>
									Privacy Policy
								</TextLink>
								.
							</label>
						</div>

						<Button
							type="submit"
							className="w-full"
							disabled={registerMutation.isPending || !agreedToTermsAndPrivacy}
							aria-busy={registerMutation.isPending}
						>
							{registerMutation.isPending ? 'Creating account...' : 'Join'}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	)
}
