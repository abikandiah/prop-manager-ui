import { MarkdownEditor } from './MarkdownEditor'

export interface TemplateMarkdownStepProps {
	value: string
	onChange: (value: string) => void
	templateParameters: Record<string, string>
}

export function TemplateMarkdownStep({
	value,
	onChange,
	templateParameters,
}: TemplateMarkdownStepProps) {
	return (
		<div className="space-y-2">
			<MarkdownEditor
				value={value}
				onChange={onChange}
				customParameters={templateParameters}
			/>
		</div>
	)
}
