import { Component, ReactNode } from 'react'
import { Card, CardContent } from '@abumble/design-system/components/Card'
import { Button } from '@abumble/design-system/components/Button'

interface ErrorBoundaryProps {
	children: ReactNode
	fallback?: ReactNode
}

interface ErrorBoundaryState {
	hasError: boolean
	error: Error | null
}

export class ErrorBoundary extends Component<
	ErrorBoundaryProps,
	ErrorBoundaryState
> {
	constructor(props: ErrorBoundaryProps) {
		super(props)
		this.state = { hasError: false, error: null }
	}

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { hasError: true, error }
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		console.error('ErrorBoundary caught an error:', error, errorInfo)
	}

	handleReset = () => {
		this.setState({ hasError: false, error: null })
		window.location.reload()
	}

	render() {
		if (this.state.hasError) {
			if (this.props.fallback) {
				return this.props.fallback
			}

			return (
				<div className="center-page p-4 mt-8">
					<Card className="max-w-2xl mx-auto">
						<CardContent className="p-6">
							<h1 className="text-2xl font-bold mb-4 text-destructive">
								Something went wrong
							</h1>
							<p className="text-muted-foreground mb-4">
								We encountered an unexpected error. Please try refreshing the
								page.
							</p>
							{this.state.error && (
								<details className="mb-4">
									<summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
										Error details
									</summary>
									<pre className="mt-2 p-4 bg-muted rounded text-xs overflow-auto">
										{this.state.error.message}
										{'\n\n'}
										{this.state.error.stack}
									</pre>
								</details>
							)}
							<Button onClick={this.handleReset}>Reload page</Button>
						</CardContent>
					</Card>
				</div>
			)
		}

		return this.props.children
	}
}
