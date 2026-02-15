import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@abumble/design-system/components/Button'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { DialogFooter } from '@abumble/design-system/components/Dialog'
import { TemplateDetailsStep } from './TemplateDetailsStep'
import { TemplateMarkdownStep } from './TemplateMarkdownStep'
import type { LateFeeType } from '@/domain/lease'
import type {
	CreateLeaseTemplatePayload,
	LeaseTemplate,
	UpdateLeaseTemplatePayload,
} from '@/domain/lease-template'
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
		templateParameters: template.templateParameters ?? {},
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
	step?: 1 | 2
	/** Step change handler (controlled by parent for FormDialog integration) */
	onStepChange?: (step: 1 | 2) => void
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
	const [internalStep, setInternalStep] = useState<1 | 2>(1)

	// Use controlled step if provided, otherwise use internal state
	const step = controlledStep ?? internalStep
	const setStep = onStepChange ?? setInternalStep
	const [form, setForm] = useState<FormState>(() =>
		initialTemplate ? templateToFormState(initialTemplate) : initialFormState,
	)
	const createTemplate = useCreateLeaseTemplate()
	const updateTemplate = useUpdateLeaseTemplate()

	const pending = createTemplate.isPending || updateTemplate.isPending

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

	const buildCreatePayload = (): CreateLeaseTemplatePayload => ({
		id: generateId(),
		...formToPayloadFields(form),
	})

	const buildUpdatePayload = (): UpdateLeaseTemplatePayload => ({
		...formToPayloadFields(form),
		active: form.active,
		version: initialTemplate?.version ?? 0,
	})

	const validateStep1 = (): boolean => {
		if (!form.name.trim()) {
			toast.error('Template name is required')
			return false
		}

		if (
			form.defaultLateFeeAmount.trim() &&
			isNaN(parseFloat(form.defaultLateFeeAmount))
		) {
			toast.error('Default late fee amount must be a valid number')
			return false
		}

		if (
			form.defaultNoticePeriodDays.trim() &&
			(isNaN(parseInt(form.defaultNoticePeriodDays, 10)) ||
				parseInt(form.defaultNoticePeriodDays, 10) < 1)
		) {
			toast.error('Notice period must be at least 1 day')
			return false
		}

		return true
	}

	const handleNext = useCallback(() => {
		if (step === 1 && validateStep1()) {
			setStep(2)
		}
	}, [step, form.name, form.defaultLateFeeAmount, form.defaultNoticePeriodDays])

	const handleBack = useCallback(() => {
		if (step === 2) {
			setStep(1)
		}
	}, [step])

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()

		if (!form.templateMarkdown.trim()) {
			toast.error('Template markdown is required')
			return
		}

		if (isEdit) {
			updateTemplate.mutate(
				{
					id: initialTemplate.id,
					payload: buildUpdatePayload(),
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
			createTemplate.mutate(buildCreatePayload(), {
				onSuccess: () => {
					toast.success('Template created')
					setForm(initialFormState)
					setStep(1)
					onSuccess?.()
				},
				onError: (err) => {
					toast.error(err.message || 'Failed to create template')
				},
			})
		}
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
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
					onActiveChange={(checked) =>
						setForm((prev) => ({ ...prev, active: checked }))
					}
					isEdit={isEdit}
				/>
			)}

			{/* Step 2: Markdown Editor */}
			{step === 2 && (
				<TemplateMarkdownStep
					value={form.templateMarkdown}
					onChange={handleMarkdownChange}
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
					{step === 2 && (
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

					{step === 1 && (
						<Button type="button" onClick={handleNext}>
							Next
							<ArrowRight className="h-4 w-4" />
						</Button>
					)}

					{step === 2 && (
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
