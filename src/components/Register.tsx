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
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { TextLink } from '@/components/ui'
import { api } from '@/api/client'

export const Register = () => {
	const [agreedToTerms, setAgreedToTerms] = useState(false)
	const [agreedToPrivacy, setAgreedToPrivacy] = useState(false)
	const queryClient = useQueryClient()

	const registerMutation = useMutation({
		mutationFn: () => api.post<User>('/register', {}),
		onSuccess: (response) => {
			const user = response.data
			queryClient.setQueryData(['me'], user)
			toast.success('Registration successful!')
		},
	})

	const isFormValid = agreedToTerms && agreedToPrivacy

	const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
		e.preventDefault()
		if (!isFormValid) {
			toast.error('Please accept all terms to continue')
			return
		}
		registerMutation.mutate()
	}

	return (
		<div className="flex flex-1 justify-center items-center">
			<Card className="w-full max-w-md mx-4">
				<CardHeader>
					<h2 className="text-2xl font-bold">Register Account</h2>
					<p className="text-muted-foreground">
						Please accept our terms and privacy policy to continue.
					</p>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-6">
						<div className="space-y-4">
							<div className="flex items-start space-x-3">
								<Checkbox
									id="terms"
									checked={agreedToTerms}
									onCheckedChange={(checked) => setAgreedToTerms(!!checked)}
									className="mt-1"
								/>
								<Label
									htmlFor="terms"
									className="text-sm font-normal leading-snug cursor-pointer"
								>
									I agree to the{' '}
									<TextLink
										to="/public/terms"
										target="_blank"
										rel="noopener noreferrer"
										className="text-primary hover:underline"
									>
										Terms of Service
									</TextLink>
								</Label>
							</div>

							<div className="flex items-start space-x-3">
								<Checkbox
									id="privacy"
									checked={agreedToPrivacy}
									onCheckedChange={(checked) => setAgreedToPrivacy(!!checked)}
									className="mt-1"
								/>
								<Label
									htmlFor="privacy"
									className="text-sm font-normal leading-snug cursor-pointer"
								>
									I agree to the{' '}
									<TextLink
										to="/public/privacy"
										target="_blank"
										rel="noopener noreferrer"
										className="text-primary hover:underline"
									>
										Privacy Policy
									</TextLink>
								</Label>
							</div>
						</div>

						<Button
							type="submit"
							className="w-full"
							disabled={registerMutation.isPending || !isFormValid}
						>
							{registerMutation.isPending
								? 'Registering...'
								: 'Accept and Register'}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	)
}
