import type { LateFeeType, Lease } from '@/domain/lease'
import { useLeaseTemplateDetail } from '@/features/lease-templates'
import { useCreateLease, useUpdateLease } from '@/features/leases/hooks'
import {
	generateId,
	parseFloatOrUndefined,
	parseIntOrUndefined,
} from '@/lib/util'
import { Button } from '@abumble/design-system/components/Button'
import { DialogFooter } from '@abumble/design-system/components/Dialog'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { LeaseDetailsStep } from './LeaseDetailsStep'
import { LeaseParametersStep } from './LeaseParametersStep'
import { LeaseTermsStep } from './LeaseTermsStep'

// ---------- Schema ----------

const optionalFloat = z
	.string()
	.refine(
		(s) => s.trim() === '' || (!isNaN(parseFloat(s)) && parseFloat(s) >= 0),
		'Must be a valid number',
	)

const leaseFormSchema = z
	.object({
		// Step 1 fields
		leaseTemplateId: z.string().min(1, 'Template is required'),
		propertyId: z.string().min(1, 'Property is required'),
		unitId: z.string().min(1, 'Unit is required'),
		startDate: z.string().min(1, 'Start date is required'),
		endDate: z.string().min(1, 'End date is required'),
		// Step 2 fields
		rentAmount: z
			.string()
			.min(1, 'Rent amount is required')
			.refine(
				(s) => !isNaN(parseFloat(s)) && parseFloat(s) > 0,
				'Rent amount must be greater than 0',
			),
		rentDueDay: z
			.string()
			.min(1, 'Rent due day is required')
			.refine((s) => {
				const n = parseInt(s, 10)
				return !isNaN(n) && n >= 1 && n <= 31
			}, 'Must be between 1 and 31'),
		securityDepositHeld: optionalFloat,
		lateFeeType: z.string().optional(),
		lateFeeAmount: optionalFloat,
		noticePeriodDays: z
			.string()
			.refine(
				(s) =>
					s.trim() === '' || (!isNaN(parseInt(s, 10)) && parseInt(s, 10) >= 0),
				'Must be a whole number',
			),
		// Step 3 fields
		templateParameters: z.record(z.string(), z.string()),
	})
	.refine(
		(data) =>
			!data.startDate ||
			!data.endDate ||
			new Date(data.endDate) > new Date(data.startDate),
		{ message: 'End date must be after start date', path: ['endDate'] },
	)

export type LeaseFormValues = z.infer<typeof leaseFormSchema>

// Fields validated at each step
const STEP_1_FIELDS: Array<keyof LeaseFormValues> = [
	'leaseTemplateId',
	'propertyId',
	'unitId',
	'startDate',
	'endDate',
]
const STEP_2_FIELDS: Array<keyof LeaseFormValues> = [
	'rentAmount',
	'rentDueDay',
	'securityDepositHeld',
	'lateFeeAmount',
	'noticePeriodDays',
]

// ---------- Default values ----------

const defaultValues: LeaseFormValues = {
	leaseTemplateId: '',
	propertyId: '',
	unitId: '',
	startDate: '',
	endDate: '',
	rentAmount: '',
	rentDueDay: '1',
	securityDepositHeld: '',
	lateFeeType: '',
	lateFeeAmount: '',
	noticePeriodDays: '',
	templateParameters: {},
}

function leaseToFormValues(lease: Lease): LeaseFormValues {
	return {
		leaseTemplateId: lease.leaseTemplateId ?? '',
		propertyId: lease.propertyId,
		unitId: lease.unitId,
		startDate: lease.startDate,
		endDate: lease.endDate,
		rentAmount: String(lease.rentAmount),
		rentDueDay: String(lease.rentDueDay),
		securityDepositHeld:
			lease.securityDepositHeld != null
				? String(lease.securityDepositHeld)
				: '',
		lateFeeType: lease.lateFeeType ?? '',
		lateFeeAmount:
			lease.lateFeeAmount != null ? String(lease.lateFeeAmount) : '',
		noticePeriodDays:
			lease.noticePeriodDays != null ? String(lease.noticePeriodDays) : '',
		templateParameters: lease.templateParameters ?? {},
	}
}

// ---------- Props ----------

export interface LeaseAgreementFormWizardProps {
	/** When set, the wizard operates in edit mode using useUpdateLease */
	initialLease?: Lease | null
	onSuccess?: (lease: Lease) => void
	onCancel?: () => void
	submitLabel?: string
	/** Current wizard step (controlled by parent for FormDialog integration) */
	step?: 1 | 2 | 3
	onStepChange?: (step: 1 | 2 | 3) => void
}

// ---------- Wizard component ----------

export function LeaseAgreementFormWizard({
	initialLease = null,
	onSuccess,
	onCancel,
	submitLabel,
	step: controlledStep,
	onStepChange,
}: LeaseAgreementFormWizardProps) {
	const isEdit = initialLease != null

	// In edit mode step 1 (details) is skipped — property/unit/template are immutable
	const [internalStep, setInternalStep] = useState<1 | 2 | 3>(isEdit ? 2 : 1)
	const step = controlledStep ?? internalStep
	const setStep = onStepChange ?? setInternalStep

	const [templateDefaultsApplied, setTemplateDefaultsApplied] = useState(isEdit)

	const createLease = useCreateLease()
	const updateLease = useUpdateLease()
	const pending = createLease.isPending || updateLease.isPending

	const form = useForm<LeaseFormValues>({
		resolver: standardSchemaResolver(leaseFormSchema),
		defaultValues: isEdit ? leaseToFormValues(initialLease) : defaultValues,
		mode: 'onTouched',
	})

	const { handleSubmit, trigger, watch, setValue, reset } = form

	const leaseTemplateId = watch('leaseTemplateId')

	const { data: selectedTemplate } = useLeaseTemplateDetail(
		leaseTemplateId || '',
		{ enabled: !!leaseTemplateId },
	)

	// Reset template defaults when template changes (create mode only)
	const prevTemplateIdRef = useRef(leaseTemplateId)
	useEffect(() => {
		if (!isEdit && leaseTemplateId !== prevTemplateIdRef.current) {
			prevTemplateIdRef.current = leaseTemplateId
			setTemplateDefaultsApplied(false)
		}
	}, [leaseTemplateId, isEdit])

	const hasParameters =
		!!selectedTemplate &&
		Object.keys(selectedTemplate.templateParameters).length > 0

	const handleNext = useCallback(async () => {
		if (step === 1) {
			const valid = await trigger(STEP_1_FIELDS)
			if (!valid) return
			// Apply template defaults once when moving from step 1 to step 2
			if (selectedTemplate && !templateDefaultsApplied) {
				setValue('lateFeeType', selectedTemplate.defaultLateFeeType ?? '')
				setValue(
					'lateFeeAmount',
					selectedTemplate.defaultLateFeeAmount != null
						? String(selectedTemplate.defaultLateFeeAmount)
						: '',
				)
				setValue(
					'noticePeriodDays',
					selectedTemplate.defaultNoticePeriodDays != null
						? String(selectedTemplate.defaultNoticePeriodDays)
						: '',
				)
				setValue('templateParameters', {
					...selectedTemplate.templateParameters,
				})
				setTemplateDefaultsApplied(true)
			}
			setStep(2)
		} else if (step === 2) {
			const valid = await trigger(STEP_2_FIELDS)
			if (!valid) return
			if (hasParameters) {
				setStep(3)
			} else {
				handleSubmit(submitForm)()
			}
		}
	}, [
		step,
		setStep,
		trigger,
		selectedTemplate,
		templateDefaultsApplied,
		setValue,
		hasParameters,
		handleSubmit,
	])

	const handleBack = useCallback(() => {
		if (step === 3) setStep(2)
		else if (step === 2 && !isEdit) setStep(1)
	}, [step, setStep, isEdit])

	const submitForm = useCallback(
		(values: LeaseFormValues) => {
			const terms = {
				startDate: values.startDate,
				endDate: values.endDate,
				rentAmount: parseFloat(values.rentAmount),
				rentDueDay: parseInt(values.rentDueDay, 10),
				securityDepositHeld:
					parseFloatOrUndefined(values.securityDepositHeld) ?? null,
				lateFeeType: (values.lateFeeType || null) as LateFeeType | null,
				lateFeeAmount: parseFloatOrUndefined(values.lateFeeAmount) ?? null,
				noticePeriodDays:
					parseIntOrUndefined(values.noticePeriodDays, 10) ?? null,
				templateParameters:
					Object.keys(values.templateParameters).length > 0
						? values.templateParameters
						: null,
			}

			if (isEdit) {
				updateLease.mutate(
					{
						id: initialLease.id,
						payload: {
							...terms,
							version: initialLease.version,
						},
						unitId: initialLease.unitId,
						propertyId: initialLease.propertyId,
					},
					{
						onSuccess: (updatedLease) => {
							toast.success('Lease updated')
							onSuccess?.(updatedLease)
						},
						onError: (err) => {
							toast.error(err.message || 'Failed to update lease')
						},
					},
				)
			} else {
				createLease.mutate(
					{
						id: generateId(),
						leaseTemplateId: values.leaseTemplateId,
						propertyId: values.propertyId,
						unitId: values.unitId,
						...terms,
						templateParameters: terms.templateParameters ?? undefined,
					},
					{
						onSuccess: (data) => {
							toast.success('Lease created')
							reset(defaultValues)
							setStep(1)
							setTemplateDefaultsApplied(false)
							onSuccess?.(data)
						},
						onError: (err) => {
							toast.error(err.message || 'Failed to create lease')
						},
					},
				)
			}
		},
		[isEdit, initialLease, createLease, updateLease, onSuccess, reset, setStep],
	)

	const resolvedSubmitLabel = submitLabel ?? (isEdit ? 'Save' : 'Create Lease')
	const pendingLabel = isEdit ? 'Saving…' : 'Creating…'
	const showBack = step === 3 || (step === 2 && !isEdit)
	const showNext = step === 1 || (step === 2 && hasParameters)
	const showSubmit = (step === 2 && !hasParameters) || step === 3

	return (
		<FormProvider {...form}>
			<form onSubmit={handleSubmit(submitForm)} className="space-y-4 pt-4">
				{step === 1 && !isEdit && <LeaseDetailsStep />}
				{step === 2 && <LeaseTermsStep />}
				{step === 3 && selectedTemplate && (
					<LeaseParametersStep
						templateMarkdown={selectedTemplate.templateMarkdown}
					/>
				)}

				<DialogFooter className="gap-2">
					{onCancel && (
						<Button type="button" variant="outline" onClick={onCancel}>
							Cancel
						</Button>
					)}

					<div className="flex gap-2">
						{showBack && (
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

						{showNext && (
							<Button type="button" onClick={handleNext} disabled={pending}>
								Next
								<ArrowRight className="h-4 w-4" />
							</Button>
						)}

						{showSubmit && (
							<Button type="submit" disabled={pending}>
								{pending ? (
									pendingLabel
								) : (
									<>
										<Check className="h-4 w-4" />
										{resolvedSubmitLabel}
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
