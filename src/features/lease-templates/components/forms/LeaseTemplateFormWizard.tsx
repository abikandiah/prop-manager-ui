import { useCallback, useRef, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { z } from 'zod'
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

// ---------- Schema ----------

const templateFormSchema = z.object({
	name: z.string().min(1, 'Template name is required').max(255),
	versionTag: z.string().max(50).optional(),
	templateMarkdown: z.string().min(1, 'Template content is required'),
	templateParameters: z.record(z.string(), z.string()),
	defaultLateFeeType: z.string().optional(),
	defaultLateFeeAmount: z
		.string()
		.refine(
			(s) => s.trim() === '' || (!isNaN(parseFloat(s)) && parseFloat(s) >= 0),
			'Must be a valid number',
		),
	defaultNoticePeriodDays: z
		.string()
		.refine(
			(s) =>
				s.trim() === '' || (!isNaN(parseInt(s, 10)) && parseInt(s, 10) >= 1),
			'Must be at least 1 day',
		),
	active: z.boolean(),
})

export type TemplateFormValues = z.infer<typeof templateFormSchema>

const STEP_1_FIELDS: Array<keyof TemplateFormValues> = [
	'name',
	'defaultLateFeeAmount',
	'defaultNoticePeriodDays',
]

// ---------- Default values ----------

const defaultValues: TemplateFormValues = {
	name: '',
	versionTag: '',
	templateMarkdown: '',
	templateParameters: {},
	defaultLateFeeType: '',
	defaultLateFeeAmount: '',
	defaultNoticePeriodDays: '',
	active: true,
}

function templateToFormValues(template: LeaseTemplate): TemplateFormValues {
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

export const LEASE_TEMPLATE_WIZARD_STEPS: Record<1 | 2 | 3, string> = {
	1: 'Template Details',
	2: 'Template Parameters',
	3: 'Template Content',
}

// ---------- Props ----------

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

// ---------- Wizard component ----------

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
	const step = controlledStep ?? internalStep
	const setStep = onStepChange ?? setInternalStep

	const createTemplate = useCreateLeaseTemplate()
	const updateTemplate = useUpdateLeaseTemplate()
	const pending = createTemplate.isPending || updateTemplate.isPending

	const form = useForm<TemplateFormValues>({
		resolver: standardSchemaResolver(templateFormSchema),
		defaultValues: initialTemplate
			? templateToFormValues(initialTemplate)
			: defaultValues,
		mode: 'onTouched',
	})

	const { handleSubmit, trigger, reset } = form

	// Stable refs so callbacks don't get stale during step navigation
	const createTemplateRef = useRef(createTemplate)
	const updateTemplateRef = useRef(updateTemplate)
	createTemplateRef.current = createTemplate
	updateTemplateRef.current = updateTemplate

	const handleNext = useCallback(async () => {
		if (step === 1) {
			const valid = await trigger(STEP_1_FIELDS)
			if (valid) setStep(2)
		} else if (step === 2) {
			setStep(3)
		}
	}, [step, setStep, trigger])

	const handleBack = useCallback(() => {
		if (step === 2) setStep(1)
		else if (step === 3) setStep(2)
	}, [step, setStep])

	const submitForm = useCallback(
		(values: TemplateFormValues) => {
			const payloadFields = {
				name: values.name.trim(),
				versionTag: trimOrUndefined(values.versionTag ?? ''),
				templateMarkdown: values.templateMarkdown.trim(),
				templateParameters:
					Object.keys(values.templateParameters).length > 0
						? values.templateParameters
						: undefined,
				defaultLateFeeType: (values.defaultLateFeeType || undefined) as
					| LateFeeType
					| undefined,
				defaultLateFeeAmount: parseFloatOrUndefined(
					values.defaultLateFeeAmount,
				),
				defaultNoticePeriodDays: parseIntOrUndefined(
					values.defaultNoticePeriodDays,
					10,
				),
			}

			if (isEdit) {
				updateTemplateRef.current.mutate(
					{
						id: initialTemplate.id,
						payload: {
							...payloadFields,
							active: values.active,
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
					{ id: generateId(), ...payloadFields },
					{
						onSuccess: () => {
							toast.success('Template created')
							reset(defaultValues)
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
		[isEdit, initialTemplate, onSuccess, reset, setStep],
	)

	return (
		<FormProvider {...form}>
			<form onSubmit={handleSubmit(submitForm)} className="space-y-4 pt-4">
				{step === 1 && <TemplateDetailsStep isEdit={isEdit} />}
				{step === 2 && <TemplateParametersStep />}
				{step === 3 && <TemplateMarkdownStep />}

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
		</FormProvider>
	)
}
