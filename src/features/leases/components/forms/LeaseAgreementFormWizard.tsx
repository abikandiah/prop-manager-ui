import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@abumble/design-system/components/Button'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { DialogFooter } from '@abumble/design-system/components/Dialog'
import { LeaseDetailsStep } from './LeaseDetailsStep'
import { LeaseTermsStep } from './LeaseTermsStep'
import { LeaseParametersStep } from './LeaseParametersStep'
import type { LateFeeType, Lease } from '@/domain/lease'
import { useCreateLease, useUpdateLease } from '@/features/leases/hooks'
import { useLeaseTemplateDetail } from '@/features/lease-templates'
import {
	generateId,
	parseFloatOrUndefined,
	parseIntOrUndefined,
} from '@/lib/util'

type FormState = {
	leaseTemplateId: string
	propertyId: string
	unitId: string
	tenantEmails: Array<string>
	startDate: string
	endDate: string
	rentAmount: string
	rentDueDay: string
	securityDepositHeld: string
	lateFeeType: LateFeeType | ''
	lateFeeAmount: string
	noticePeriodDays: string
	templateParameters: Record<string, string>
}

const initialFormState: FormState = {
	leaseTemplateId: '',
	propertyId: '',
	unitId: '',
	tenantEmails: [],
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

function leaseToFormState(lease: Lease): FormState {
	return {
		leaseTemplateId: lease.leaseTemplateId ?? '',
		propertyId: lease.propertyId,
		unitId: lease.unitId,
		tenantEmails: [],
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

export interface LeaseAgreementFormWizardProps {
	/** When set, the wizard operates in edit mode using useUpdateLease */
	initialLease?: Lease | null
	onSuccess?: () => void
	onCancel?: () => void
	submitLabel?: string
	/** Current wizard step (controlled by parent for FormDialog integration) */
	step?: 1 | 2 | 3
	/** Step change handler (controlled by parent for FormDialog integration) */
	onStepChange?: (step: 1 | 2 | 3) => void
}

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

	const [form, setForm] = useState<FormState>(() =>
		isEdit ? leaseToFormState(initialLease) : initialFormState,
	)
	// Template defaults are already reflected in the lease on edit
	const [templateDefaultsApplied, setTemplateDefaultsApplied] = useState(isEdit)

	const createLease = useCreateLease()
	const updateLease = useUpdateLease()

	const { data: selectedTemplate } = useLeaseTemplateDetail(
		form.leaseTemplateId || '',
		{ enabled: !!form.leaseTemplateId },
	)

	const pending = createLease.isPending || updateLease.isPending

	const formRef = useRef(form)
	formRef.current = form

	// Reset template defaults when template changes (create mode only)
	useEffect(() => {
		if (!isEdit) setTemplateDefaultsApplied(false)
	}, [form.leaseTemplateId, isEdit])

	const handleChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
			const { name, value } = e.target
			setForm((prev) => ({
				...prev,
				[name]: name === 'lateFeeType' ? (value as LateFeeType | '') : value,
				// Clear dependent unit when property changes
				...(name === 'propertyId' && value !== prev.propertyId
					? { unitId: '' }
					: {}),
			}))
		},
		[],
	)

	const handleTenantEmailsChange = useCallback((emails: Array<string>) => {
		setForm((prev) => ({ ...prev, tenantEmails: emails }))
	}, [])

	const handleParametersChange = useCallback(
		(parameters: Record<string, string>) => {
			setForm((prev) => ({ ...prev, templateParameters: parameters }))
		},
		[],
	)

	const validateStep1 = useCallback((): boolean => {
		const f = formRef.current
		if (!f.leaseTemplateId) {
			toast.error('Template is required')
			return false
		}
		if (!f.propertyId) {
			toast.error('Property is required')
			return false
		}
		if (!f.unitId) {
			toast.error('Unit is required')
			return false
		}
		if (f.tenantEmails.length === 0) {
			toast.error('At least one tenant email is required')
			return false
		}
		if (!f.startDate) {
			toast.error('Start date is required')
			return false
		}
		if (!f.endDate) {
			toast.error('End date is required')
			return false
		}
		if (new Date(f.endDate) <= new Date(f.startDate)) {
			toast.error('End date must be after start date')
			return false
		}
		return true
	}, [])

	const validateStep2 = useCallback((): boolean => {
		const f = formRef.current
		if (!f.rentAmount.trim() || isNaN(parseFloat(f.rentAmount))) {
			toast.error('Rent amount must be a valid number')
			return false
		}
		if (parseFloat(f.rentAmount) <= 0) {
			toast.error('Rent amount must be greater than 0')
			return false
		}
		if (!f.rentDueDay.trim() || isNaN(parseInt(f.rentDueDay, 10))) {
			toast.error('Rent due day must be a valid number')
			return false
		}
		const dueDay = parseInt(f.rentDueDay, 10)
		if (dueDay < 1 || dueDay > 31) {
			toast.error('Rent due day must be between 1 and 31')
			return false
		}
		if (
			f.securityDepositHeld.trim() &&
			isNaN(parseFloat(f.securityDepositHeld))
		) {
			toast.error('Security deposit must be a valid number')
			return false
		}
		if (f.lateFeeAmount.trim() && isNaN(parseFloat(f.lateFeeAmount))) {
			toast.error('Late fee amount must be a valid number')
			return false
		}
		if (f.noticePeriodDays.trim() && isNaN(parseInt(f.noticePeriodDays, 10))) {
			toast.error('Notice period must be a valid number')
			return false
		}
		return true
	}, [])

	const submitForm = useCallback(() => {
		const f = formRef.current

		if (isEdit) {
			updateLease.mutate(
				{
					id: initialLease.id,
					payload: {
						startDate: f.startDate,
						endDate: f.endDate,
						rentAmount: parseFloat(f.rentAmount),
						rentDueDay: parseInt(f.rentDueDay, 10),
						securityDepositHeld:
							parseFloatOrUndefined(f.securityDepositHeld) ?? null,
						lateFeeType: f.lateFeeType || null,
						lateFeeAmount: parseFloatOrUndefined(f.lateFeeAmount) ?? null,
						noticePeriodDays:
							parseIntOrUndefined(f.noticePeriodDays, 10) ?? null,
						templateParameters:
							Object.keys(f.templateParameters).length > 0
								? f.templateParameters
								: null,
						version: initialLease.version,
					},
					unitId: initialLease.unitId,
					propertyId: initialLease.propertyId,
				},
				{
					onSuccess: () => {
						toast.success('Lease updated')
						onSuccess?.()
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
					leaseTemplateId: f.leaseTemplateId,
					propertyId: f.propertyId,
					unitId: f.unitId,
					tenantEmails: f.tenantEmails,
					startDate: f.startDate,
					endDate: f.endDate,
					rentAmount: parseFloat(f.rentAmount),
					rentDueDay: parseInt(f.rentDueDay, 10),
					securityDepositHeld: parseFloatOrUndefined(f.securityDepositHeld),
					lateFeeType: f.lateFeeType || undefined,
					lateFeeAmount: parseFloatOrUndefined(f.lateFeeAmount),
					noticePeriodDays: parseIntOrUndefined(f.noticePeriodDays, 10),
					templateParameters:
						Object.keys(f.templateParameters).length > 0
							? f.templateParameters
							: undefined,
				},
				{
					onSuccess: () => {
						toast.success('Lease created')
						setForm(initialFormState)
						setStep(1)
						setTemplateDefaultsApplied(false)
						onSuccess?.()
					},
					onError: (err) => {
						toast.error(err.message || 'Failed to create lease')
					},
				},
			)
		}
	}, [isEdit, initialLease, createLease, updateLease, onSuccess, setStep])

	const handleNext = useCallback(() => {
		if (step === 1 && validateStep1()) {
			// Apply template defaults once when moving from step 1 to step 2
			if (selectedTemplate && !templateDefaultsApplied) {
				setForm((prev) => ({
					...prev,
					lateFeeType: selectedTemplate.defaultLateFeeType ?? '',
					lateFeeAmount:
						selectedTemplate.defaultLateFeeAmount != null
							? String(selectedTemplate.defaultLateFeeAmount)
							: '',
					noticePeriodDays:
						selectedTemplate.defaultNoticePeriodDays != null
							? String(selectedTemplate.defaultNoticePeriodDays)
							: '',
					templateParameters: { ...selectedTemplate.templateParameters },
				}))
				setTemplateDefaultsApplied(true)
			}
			setStep(2)
		} else if (step === 2 && validateStep2()) {
			const hasParameters =
				selectedTemplate &&
				Object.keys(selectedTemplate.templateParameters).length > 0
			if (hasParameters) {
				setStep(3)
			} else {
				submitForm()
			}
		}
	}, [
		step,
		setStep,
		validateStep1,
		validateStep2,
		selectedTemplate,
		templateDefaultsApplied,
		submitForm,
	])

	const handleBack = useCallback(() => {
		if (step === 3) setStep(2)
		else if (step === 2 && !isEdit) setStep(1)
	}, [step, setStep, isEdit])

	const handleSubmit = useCallback(
		(e: React.FormEvent) => {
			e.preventDefault()
			submitForm()
		},
		[submitForm],
	)

	const hasParameters =
		selectedTemplate &&
		Object.keys(selectedTemplate.templateParameters).length > 0

	const resolvedSubmitLabel = submitLabel ?? (isEdit ? 'Save' : 'Create Lease')
	const pendingLabel = isEdit ? 'Saving…' : 'Creating…'
	const showBack = step === 3 || (step === 2 && !isEdit)
	const showNext = step === 1 || (step === 2 && hasParameters)
	const showSubmit = (step === 2 && !hasParameters) || step === 3

	return (
		<form onSubmit={handleSubmit} className="space-y-4 pt-4">
			{step === 1 && !isEdit && (
				<LeaseDetailsStep
					leaseTemplateId={form.leaseTemplateId}
					propertyId={form.propertyId}
					unitId={form.unitId}
					tenantEmails={form.tenantEmails}
					startDate={form.startDate}
					endDate={form.endDate}
					onFieldChange={handleChange}
					onTenantEmailsChange={handleTenantEmailsChange}
				/>
			)}

			{step === 2 && (
				<LeaseTermsStep
					rentAmount={form.rentAmount}
					rentDueDay={form.rentDueDay}
					securityDepositHeld={form.securityDepositHeld}
					lateFeeType={form.lateFeeType}
					lateFeeAmount={form.lateFeeAmount}
					noticePeriodDays={form.noticePeriodDays}
					onFieldChange={handleChange}
				/>
			)}

			{step === 3 && selectedTemplate && (
				<LeaseParametersStep
					templateParameters={form.templateParameters}
					templateMarkdown={selectedTemplate.templateMarkdown}
					onParametersChange={handleParametersChange}
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
	)
}
