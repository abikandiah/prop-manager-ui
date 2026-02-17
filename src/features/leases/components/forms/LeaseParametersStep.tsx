import { Input } from '@abumble/design-system/components/Input'
import { Label } from '@abumble/design-system/components/Label'
import ReactMarkdown from 'react-markdown'

interface LeaseParametersStepProps {
	templateParameters: Record<string, string>
	templateMarkdown: string
	onParametersChange: (parameters: Record<string, string>) => void
}

export function LeaseParametersStep({
	templateParameters,
	templateMarkdown,
	onParametersChange,
}: LeaseParametersStepProps) {
	const handleParameterChange = (key: string, value: string) => {
		onParametersChange({
			...templateParameters,
			[key]: value,
		})
	}

	// Replace template parameters in markdown for preview
	const renderPreview = () => {
		let rendered = templateMarkdown
		Object.entries(templateParameters).forEach(([key, value]) => {
			const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
			rendered = rendered.replace(regex, value || `{{${key}}}`)
		})
		return rendered
	}

	const parameterKeys = Object.keys(templateParameters)

	if (parameterKeys.length === 0) {
		return (
			<div className="text-center py-8 text-muted-foreground">
				This template has no custom parameters to fill in.
			</div>
		)
	}

	return (
		<div className="space-y-6">
			{/* Parameter inputs */}
			<div className="space-y-4">
				<div className="text-sm font-medium text-foreground">
					Fill in template parameters
				</div>
				<div className="grid gap-4 sm:grid-cols-2">
					{parameterKeys.map((key) => (
						<div key={key} className="space-y-2">
							<Label htmlFor={`param-${key}`} className="font-mono text-xs">
								{'{{'}
								{key}
								{'}}'}
							</Label>
							<Input
								id={`param-${key}`}
								value={templateParameters[key] || ''}
								onChange={(e) => handleParameterChange(key, e.target.value)}
								placeholder={`Enter ${key}`}
							/>
						</div>
					))}
				</div>
			</div>

			{/* Live preview */}
			<div className="border-t pt-6">
				<div className="text-sm font-medium text-foreground mb-2">
					Lease Preview
				</div>
				<div className="rounded-md border bg-muted/20 p-6 max-h-96 overflow-y-auto">
					<div className="prose prose-sm dark:prose-invert max-w-none">
						<ReactMarkdown>{renderPreview()}</ReactMarkdown>
					</div>
				</div>
			</div>
		</div>
	)
}
