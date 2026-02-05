import { Button } from '@abumble/design-system/components/Button'
import {
	Card,
	CardContent,
	CardHeader,
} from '@abumble/design-system/components/Card'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import { PageDescription, PageHeader } from '@/components/ui'
import { Label } from '@/components/ui/label'
import { api, setDevToken } from '@/api/client'

export const Route = createFileRoute('/dev/auth')({
	component: DevAuth,
})

function DevAuth() {
	const [username, setUsername] = useState('')
	const [password, setPassword] = useState('')
	const [loading, setLoading] = useState(false)
	const navigate = useNavigate()

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setLoading(true)
		try {
			// Endpoint specified by user: /api/dev/login
			// Our axios 'api' has baseURL: /api
			const response = await api.post('/dev/login', { username, password })
			console.log(response.data)
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
							<input
								id="username"
								type="text"
								autoComplete="username"
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
								required
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="password">Password</Label>
							<input
								id="password"
								type="password"
								autoComplete="current-password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
								required
							/>
						</div>
						<Button
							type="submit"
							className="w-full h-11 mt-2 font-medium"
							disabled={loading}
						>
							{loading ? 'Logging in...' : 'Login'}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	)
}
