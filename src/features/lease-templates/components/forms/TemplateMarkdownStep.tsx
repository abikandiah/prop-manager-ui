import { MarkdownEditor } from './MarkdownEditor'

export interface TemplateMarkdownStepProps {
	value: string
	onChange: (value: string) => void
}

export function TemplateMarkdownStep({ value, onChange }: TemplateMarkdownStepProps) {
	return (
		<div className="space-y-2 pt-4">
			<MarkdownEditor value={value} onChange={onChange} />
		</div>
	)
}
