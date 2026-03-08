interface FieldErrorProps {
	message?: string
}

export function FieldError({ message }: FieldErrorProps) {
	if (!message) return null
	return (
		<p role="alert" className="min-h-5 text-sm text-destructive mt-1">
			{message ?? ''}
		</p>
	)
}
