import { Button } from '@abumble/design-system/components/Button'
import {
	Card,
	CardContent,
	CardHeader,
} from '@abumble/design-system/components/Card'
import { Input } from '@abumble/design-system/components/Input'
import { useState } from 'react'
import { toast } from 'sonner'
import { api, setDevToken } from '@/api/client'
import { Label } from '@/components/ui/label'

interface DevAuthFormProps {
	/** Called after successful login (e.g. to re-render parent or navigate). */
	onSuccess?: () => void
	/** If true, render inside a Card; if false, only the form (for embedding). */
	wrappedInCard?: boolean
}

export function DevAuthForm({
	onSuccess,
	wrappedInCard = true,
}: DevAuthFormProps) {
	const [username, setUsername] = useState('')
	const [password, setPassword] = useState('')
	const [loading, setLoading] = useState(false)

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		setLoading(true)
		try {
			const response = await api.post<{ token: string }>('/dev/login', {
				username,
				password,
			})
			const token = response.data?.token

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
				<Label htmlFor="dev-username">Username</Label>
				<Input
					id="dev-username"
					type="text"
					autoComplete="username"
					value={username}
					onChange={(e) => setUsername(e.target.value)}
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
			<Button
				type="submit"
				className="w-full h-11 mt-2 font-medium"
				disabled={loading || !username.trim() || !password}
			>
				{loading ? 'Logging in...' : 'Login'}
			</Button>
		</form>
	)

	if (!wrappedInCard) return form

	return (
		<Card className="w-full max-w-md">
			<CardHeader className="pb-4">
				<h2 className="text-2xl font-semibold tracking-tight text-foreground">
					Login
				</h2>
				<p className="text-sm text-muted-foreground">
					Enter your dev credentials
				</p>
			</CardHeader>
			<CardContent className="grid gap-6">{form}</CardContent>
		</Card>
	)
}
