import { Button } from '@abumble/design-system/components/Button'
import {
	Card,
	CardContent,
	CardHeader,
} from '@abumble/design-system/components/Card'
import { Input } from '@abumble/design-system/components/Input'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import { api, setDevToken } from '@/api/client'
import { PageDescription, PageHeader } from '@/components/ui'
import { Label } from '@/components/ui/label'

export const Route = createFileRoute('/dev/auth')({
	component: DevAuth,
})

function DevAuth() {
	const [username, setUsername] = useState('')
	const [password, setPassword] = useState('')
	const [loading, setLoading] = useState(false)
	const navigate = useNavigate()

	const handleSubmit = async (e: React.SubmitEvent) => {
		e.preventDefault()
		setLoading(true)
		try {
			const response = await api.post('/dev/login', { username, password })
			const token = response.data.token

			if (token) {
				setDevToken(token)
				toast.success('Successfully logged in (Dev Mode)')
				navigate({ to: '/' })
			} else {
				toast.error('No token received in response')
			}
		} catch (error: any) {
			console.error('Login failed', error)
			const message =
				error.response?.data?.message || error.message || 'Login failed'
			toast.error(message)
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="flex flex-col items-center justify-center flex-1 gap-12 px-4 py-12 min-h-[60vh]">
			<div className="text-center space-y-4">
				<PageHeader>Dev Authentication</PageHeader>
				<PageDescription className="max-w-2xl mx-auto">
					Use this to authenticate against the backend
				</PageDescription>
			</div>

			<Card className="w-full max-w-md border-muted/50">
				<CardHeader className="space-y-1.5 pb-6">
					<h2 className="text-2xl font-semibold tracking-tight text-foreground">
						Login
					</h2>
					<p className="text-sm text-muted-foreground">
						Enter your credentials for <code>/api/dev/login</code>
					</p>
				</CardHeader>
				<CardContent className="grid gap-6">
					<form onSubmit={handleSubmit} className="grid gap-5">
						<div className="grid gap-2">
							<Label htmlFor="username">Username</Label>
							<Input
								id="username"
								type="text"
								autoComplete="username"
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								required
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="password">Password</Label>
							<Input
								id="password"
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
				</CardContent>
			</Card>
		</div>
	)
}
