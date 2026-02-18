import { Controller, useFormContext } from 'react-hook-form'
import { MarkdownEditor } from './MarkdownEditor'
import type { TemplateFormValues } from './LeaseTemplateFormWizard'
import { FieldError } from '@/components/ui/FieldError'

export function TemplateMarkdownStep() {
	const {
		control,
		watch,
		formState: { errors },
	} = useFormContext<TemplateFormValues>()

	const templateParameters = watch('templateParameters')

	return (
		<div className="space-y-2">
			<Controller
				name="templateMarkdown"
				control={control}
				render={({ field }) => (
					<MarkdownEditor
						value={field.value}
						onChange={field.onChange}
						customParameters={templateParameters}
					/>
				)}
			/>
			<FieldError message={errors.templateMarkdown?.message} />
		</div>
	)
}
