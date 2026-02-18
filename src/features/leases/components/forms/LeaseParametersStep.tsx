import { useCallback, useMemo } from 'react'
import { useFormContext } from 'react-hook-form'
import { Input } from '@abumble/design-system/components/Input'
import { Label } from '@abumble/design-system/components/Label'
import ReactMarkdown from 'react-markdown'
import type { LeaseFormValues } from './LeaseAgreementFormWizard'

interface LeaseParametersStepProps {
	templateMarkdown: string
}

export function LeaseParametersStep({
	templateMarkdown,
}: LeaseParametersStepProps) {
	const { watch, setValue } = useFormContext<LeaseFormValues>()
	const templateParameters = watch('templateParameters')

	const handleParameterChange = useCallback(
		(key: string, value: string) => {
			setValue('templateParameters', { ...templateParameters, [key]: value })
		},
		[templateParameters, setValue],
	)

	const previewMarkdown = useMemo(() => {
		let rendered = templateMarkdown
		Object.entries(templateParameters).forEach(([key, value]) => {
			const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
			rendered = rendered.replace(regex, value || `{{${key}}}`)
		})
		return rendered
	}, [templateMarkdown, templateParameters])

	const parameterKeys = Object.keys(templateParameters)

	if (parameterKeys.length === 0) {
		return (
			<div className="text-center py-8 text-muted-foreground">
				This template has no custom parameters to fill in.
			</div>
		)
	}

	return (
		<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<div className="space-y-4">
				<div className="text-sm font-medium text-foreground">
					Fill in template parameters
				</div>
				<div className="grid gap-3">
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

			<div className="space-y-2">
				<div className="text-sm font-medium text-foreground">
					Lease preview
				</div>
				<div className="rounded-md border bg-muted/20 p-4 h-[min(calc(100vh-22rem),28rem)] overflow-y-auto lg:h-full lg:max-h-[28rem]">
					<div className="prose prose-sm dark:prose-invert max-w-none">
						<ReactMarkdown>{previewMarkdown}</ReactMarkdown>
					</div>
				</div>
			</div>
		</div>
	)
}
