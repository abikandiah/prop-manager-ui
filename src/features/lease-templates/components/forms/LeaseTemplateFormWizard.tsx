import { useCallback, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@abumble/design-system/components/Button'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { DialogFooter } from '@abumble/design-system/components/Dialog'
import { TemplateDetailsStep } from './TemplateDetailsStep'
import { TemplateParametersStep } from './TemplateParametersStep'
import { TemplateMarkdownStep } from './TemplateMarkdownStep'
import type { LateFeeType } from '@/domain/lease'
import type { LeaseTemplate } from '@/domain/lease-template'
import {
	useCreateLeaseTemplate,
	useUpdateLeaseTemplate,
} from '@/features/lease-templates/hooks'
import {
	generateId,
	parseFloatOrUndefined,
	parseIntOrUndefined,
	trimOrUndefined,
} from '@/lib/util'

type FormState = {
	name: string
	versionTag: string
	templateMarkdown: string
	templateParameters: Record<string, string>
	defaultLateFeeType: LateFeeType | ''
	defaultLateFeeAmount: string
	defaultNoticePeriodDays: string
	active: boolean
}

const initialFormState: FormState = {
	name: '',
	versionTag: '',
	templateMarkdown: '',
	templateParameters: {},
	defaultLateFeeType: '',
	defaultLateFeeAmount: '',
	defaultNoticePeriodDays: '',
	active: true,
}

function templateToFormState(template: LeaseTemplate): FormState {
	return {
		name: template.name,
		versionTag: template.versionTag ?? '',
		templateMarkdown: template.templateMarkdown,
		templateParameters: template.templateParameters,
		defaultLateFeeType: template.defaultLateFeeType ?? '',
		defaultLateFeeAmount:
			template.defaultLateFeeAmount != null
				? String(template.defaultLateFeeAmount)
				: '',
		defaultNoticePeriodDays:
			template.defaultNoticePeriodDays != null
				? String(template.defaultNoticePeriodDays)
				: '',
		active: template.active,
	}
}

function formToPayloadFields(form: FormState) {
	return {
		name: form.name.trim(),
		versionTag: trimOrUndefined(form.versionTag),
		templateMarkdown: form.templateMarkdown.trim(),
		templateParameters:
			Object.keys(form.templateParameters).length > 0
				? form.templateParameters
				: undefined,
		defaultLateFeeType: form.defaultLateFeeType || undefined,
		defaultLateFeeAmount: parseFloatOrUndefined(form.defaultLateFeeAmount),
		defaultNoticePeriodDays: parseIntOrUndefined(
			form.defaultNoticePeriodDays,
			10,
		),
	}
}

export interface LeaseTemplateFormWizardProps {
	initialTemplate?: LeaseTemplate | null
	onSuccess?: (data?: LeaseTemplate) => void
	onCancel?: () => void
	submitLabel?: string
	/** Current wizard step (controlled by parent for FormDialog integration) */
	step?: 1 | 2 | 3
	/** Step change handler (controlled by parent for FormDialog integration) */
	onStepChange?: (step: 1 | 2 | 3) => void
}

export function LeaseTemplateFormWizard({
	initialTemplate = null,
	onSuccess,
	onCancel,
	submitLabel = 'Create Template',
	step: controlledStep,
	onStepChange,
}: LeaseTemplateFormWizardProps) {
	const isEdit = initialTemplate != null
	const [internalStep, setInternalStep] = useState<1 | 2 | 3>(1)

	// Use controlled step if provided, otherwise use internal state
	const step = controlledStep ?? internalStep
	const setStep = onStepChange ?? setInternalStep
	const [form, setForm] = useState<FormState>(() =>
		initialTemplate ? templateToFormState(initialTemplate) : initialFormState,
	)
	const createTemplate = useCreateLeaseTemplate()
	const updateTemplate = useUpdateLeaseTemplate()

	const pending = createTemplate.isPending || updateTemplate.isPending

	// Refs for stable callbacks
	const formRef = useRef(form)
	const createTemplateRef = useRef(createTemplate)
	const updateTemplateRef = useRef(updateTemplate)
	formRef.current = form
	createTemplateRef.current = createTemplate
	updateTemplateRef.current = updateTemplate

	const handleChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
			const { name, value } = e.target
			setForm((prev) => ({
				...prev,
				[name]:
					name === 'defaultLateFeeType' ? (value as LateFeeType | '') : value,
			}))
		},
		[],
	)

	const handleMarkdownChange = useCallback((value: string) => {
		setForm((prev) => ({ ...prev, templateMarkdown: value }))
	}, [])

	const handleParametersChange = useCallback(
		(parameters: Record<string, string>) => {
			setForm((prev) => ({ ...prev, templateParameters: parameters }))
		},
		[],
	)

	const validateStep1 = useCallback((): boolean => {
		const currentForm = formRef.current
		if (!currentForm.name.trim()) {
			toast.error('Template name is required')
			return false
		}

		if (
			currentForm.defaultLateFeeAmount.trim() &&
			isNaN(parseFloat(currentForm.defaultLateFeeAmount))
		) {
			toast.error('Default late fee amount must be a valid number')
			return false
		}

		if (
			currentForm.defaultNoticePeriodDays.trim() &&
			(isNaN(parseInt(currentForm.defaultNoticePeriodDays, 10)) ||
				parseInt(currentForm.defaultNoticePeriodDays, 10) < 1)
		) {
			toast.error('Notice period must be at least 1 day')
			return false
		}

		return true
	}, [])

	const handleNext = useCallback(() => {
		if (step === 1 && validateStep1()) {
			setStep(2)
		} else if (step === 2) {
			setStep(3)
		}
	}, [step, setStep, validateStep1])

	const handleBack = useCallback(() => {
		if (step === 2) {
			setStep(1)
		} else if (step === 3) {
			setStep(2)
		}
	}, [step, setStep])

	const handleActiveChange = useCallback((checked: boolean) => {
		setForm((prev) => ({ ...prev, active: checked }))
	}, [])

	const handleSubmit = useCallback(
		(e: React.FormEvent) => {
			e.preventDefault()

			const currentForm = formRef.current
			if (!currentForm.templateMarkdown.trim()) {
				toast.error('Template markdown is required')
				return
			}

			if (initialTemplate != null) {
				updateTemplateRef.current.mutate(
					{
						id: initialTemplate.id,
						payload: {
							...formToPayloadFields(currentForm),
							active: currentForm.active,
							version: initialTemplate.version,
						},
					},
					{
						onSuccess: () => {
							toast.success('Template updated')
							onSuccess?.()
						},
						onError: (err) => {
							toast.error(err.message || 'Failed to update template')
						},
					},
				)
			} else {
				createTemplateRef.current.mutate(
					{
						id: generateId(),
						...formToPayloadFields(currentForm),
					},
					{
						onSuccess: () => {
							toast.success('Template created')
							setForm(initialFormState)
							setStep(1)
							onSuccess?.()
						},
						onError: (err) => {
							toast.error(err.message || 'Failed to create template')
						},
					},
				)
			}
		},
		[initialTemplate, onSuccess, setStep],
	)

	return (
		<form onSubmit={handleSubmit} className="space-y-4 pt-4">
			{/* Step 1: Template Details */}
			{step === 1 && (
				<TemplateDetailsStep
					name={form.name}
					versionTag={form.versionTag}
					defaultLateFeeType={form.defaultLateFeeType}
					defaultLateFeeAmount={form.defaultLateFeeAmount}
					defaultNoticePeriodDays={form.defaultNoticePeriodDays}
					active={form.active}
					onFieldChange={handleChange}
					onActiveChange={handleActiveChange}
					isEdit={isEdit}
				/>
			)}

			{/* Step 2: Template Parameters */}
			{step === 2 && (
				<TemplateParametersStep
					templateParameters={form.templateParameters}
					onParametersChange={handleParametersChange}
				/>
			)}

			{/* Step 3: Markdown Editor */}
			{step === 3 && (
				<TemplateMarkdownStep
					value={form.templateMarkdown}
					onChange={handleMarkdownChange}
					templateParameters={form.templateParameters}
				/>
			)}

			{/* Footer with Navigation */}
			<DialogFooter className="gap-2">
				{onCancel && (
					<Button type="button" variant="outline" onClick={onCancel}>
						Cancel
					</Button>
				)}

				<div className="flex gap-2">
					{(step === 2 || step === 3) && (
						<Button
							type="button"
							variant="outline"
							onClick={handleBack}
							disabled={pending}
						>
							<ArrowLeft className="h-4 w-4" />
							Back
						</Button>
					)}

					{(step === 1 || step === 2) && (
						<Button type="button" onClick={handleNext}>
							Next
							<ArrowRight className="h-4 w-4" />
						</Button>
					)}

					{step === 3 && (
						<Button type="submit" disabled={pending}>
							{pending ? (
								'Saving…'
							) : (
								<>
									<Check className="h-4 w-4" />
									{submitLabel}
								</>
							)}
						</Button>
					)}
				</div>
			</DialogFooter>
		</form>
	)
}
