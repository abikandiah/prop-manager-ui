import { setDevToken } from '@/api/client'
import { FormActions, FormCard } from '@/components/ui/FormCard'
import { Button } from '@abumble/design-system/components/Button'
import { Input } from '@abumble/design-system/components/Input'
import { Label } from '@abumble/design-system/components/Label'
import { useState } from 'react'
import { toast } from 'sonner'
import { authApi } from '../../api'

interface DevAuthFormProps {
	onSuccess?: () => void
}

export function DevAuthForm({ onSuccess }: DevAuthFormProps) {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [loading, setLoading] = useState(false)

	const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
		e.preventDefault()
		setLoading(true)
		try {
			const { token } = await authApi.devLogin({ email, password })

			if (token) {
				setDevToken(token)
				toast.success('Successfully logged in (Dev Mode)')
				onSuccess?.()
			} else {
				toast.error('No token received in response')
			}
		} catch (error: unknown) {
			console.error('Login failed', error)
			const err = error as {
				response?: { data?: { message?: string }; message?: string }
				message?: string
			}
			const message =
				err.response?.data?.message ?? err.message ?? 'Login failed'
			toast.error(message)
		} finally {
			setLoading(false)
		}
	}

	const form = (
		<form onSubmit={handleSubmit} className="grid gap-5">
			<div className="grid gap-2">
				<Label htmlFor="dev-email">Email</Label>
				<Input
					id="dev-email"
					type="email"
					autoComplete="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					required
				/>
			</div>
			<div className="grid gap-2">
				<Label htmlFor="dev-password">Password</Label>
				<Input
					id="dev-password"
					type="password"
					autoComplete="current-password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					required
				/>
			</div>
			<FormActions>
				<Button type="submit" disabled={loading || !email.trim() || !password}>
					{loading ? 'Logging in...' : 'Login'}
				</Button>
			</FormActions>
		</form>
	)

	return (
		<FormCard title="Login" description="Enter your dev credentials">
			{form}
		</FormCard>
	)
}
