import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@abumble/design-system/components/Button'
import { Input } from '@abumble/design-system/components/Input'
import type {
	CreateLeasePayload,
	Lease,
	LateFeeType,
	UpdateLeasePayload,
} from '@/domain/lease'
import { DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { useCreateLease, useUpdateLease } from '@/features/leases/hooks'
import { useUnitsList } from '@/features/units'
import { usePropsList } from '@/features/props'
import { useLeaseTemplatesActive } from '@/features/lease-templates'
import { LATE_FEE_TYPES } from '@/domain/lease'
import { generateId } from '@/lib/util'

type FormState = {
	leaseTemplateId: string
	propertyId: string
	unitId: string
	startDate: string
	endDate: string
	rentAmount: string
	rentDueDay: string
	securityDepositHeld: string
	lateFeeType: LateFeeType | ''
	lateFeeAmount: string
	noticePeriodDays: string
}

const initialFormState: FormState = {
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
}

function leaseToFormState(lease: Lease): FormState {
	return {
		leaseTemplateId: lease.leaseTemplateId ?? '',
		propertyId: lease.propertyId,
		unitId: lease.unitId,
		startDate: lease.startDate,
		endDate: lease.endDate,
		rentAmount: String(lease.rentAmount),
		rentDueDay: String(lease.rentDueDay),
		securityDepositHeld:
			lease.securityDepositHeld != null ? String(lease.securityDepositHeld) : '',
		lateFeeType: lease.lateFeeType ?? '',
		lateFeeAmount:
			lease.lateFeeAmount != null ? String(lease.lateFeeAmount) : '',
		noticePeriodDays:
			lease.noticePeriodDays != null ? String(lease.noticePeriodDays) : '',
	}
}

export interface LeaseFormProps {
	propertyId?: string
	unitId?: string
	initialLease?: Lease | null
	onSuccess?: (data?: Lease) => void
	onCancel?: () => void
	submitLabel?: string
}

export function LeaseForm({
	propertyId,
	unitId,
	initialLease = null,
	onSuccess,
	onCancel,
	submitLabel = 'Create Lease',
}: LeaseFormProps) {
	const isEdit = initialLease != null
	const [form, setForm] = useState<FormState>(() => {
		const state = initialLease ? leaseToFormState(initialLease) : initialFormState
		if (propertyId) state.propertyId = propertyId
		if (unitId) state.unitId = unitId
		return state
	})
	const createLease = useCreateLease()
	const updateLease = useUpdateLease()
	const { data: propsList } = usePropsList()
	const { data: unitsList } = useUnitsList()
	const { data: activeTemplates } = useLeaseTemplatesActive()

	useEffect(() => {
		if (initialLease) {
			setForm(leaseToFormState(initialLease))
		} else {
			setForm((prev) => ({
				...initialFormState,
				propertyId: propertyId ?? prev.propertyId,
				unitId: unitId ?? prev.unitId,
			}))
		}
	}, [initialLease, propertyId, unitId])

	const pending = createLease.isPending || updateLease.isPending

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
	) => {
		const { name, value } = e.target
		setForm((prev) => ({
			...prev,
			[name]:
				name === 'lateFeeType'
					? (value as LateFeeType | '')
					: value,
		}))
	}

	const buildCreatePayload = (): CreateLeasePayload => ({
		id: generateId(), // ✅ Generate client-side ID for idempotency
		leaseTemplateId: form.leaseTemplateId,
		propertyId: form.propertyId || propertyId || '',
		unitId: form.unitId || unitId || '',
		startDate: form.startDate,
		endDate: form.endDate,
		rentAmount: parseFloat(form.rentAmount),
		rentDueDay: parseInt(form.rentDueDay, 10),
		securityDepositHeld: form.securityDepositHeld.trim()
			? parseFloat(form.securityDepositHeld)
			: undefined,
		lateFeeType: form.lateFeeType || undefined,
		lateFeeAmount: form.lateFeeAmount.trim()
			? parseFloat(form.lateFeeAmount)
			: undefined,
		noticePeriodDays: form.noticePeriodDays.trim()
			? parseInt(form.noticePeriodDays, 10)
			: undefined,
	})

	const buildUpdatePayload = (): UpdateLeasePayload => ({
		startDate: form.startDate,
		endDate: form.endDate,
		rentAmount: parseFloat(form.rentAmount),
		rentDueDay: parseInt(form.rentDueDay, 10),
		securityDepositHeld: form.securityDepositHeld.trim()
			? parseFloat(form.securityDepositHeld)
			: null,
		lateFeeType: form.lateFeeType || null,
		lateFeeAmount: form.lateFeeAmount.trim()
			? parseFloat(form.lateFeeAmount)
			: null,
		noticePeriodDays: form.noticePeriodDays.trim()
			? parseInt(form.noticePeriodDays, 10)
			: null,
		version: initialLease?.version ?? 0,
	})

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()

		// Validation for create mode
		if (!isEdit) {
			if (!form.leaseTemplateId) {
				toast.error('Template is required')
				return
			}
			if (!form.propertyId && !propertyId) {
				toast.error('Property is required')
				return
			}
			if (!form.unitId && !unitId) {
				toast.error('Unit is required')
				return
			}
		}

		// Validate required fields
		if (!form.startDate) {
			toast.error('Start date is required')
			return
		}
		if (!form.endDate) {
			toast.error('End date is required')
			return
		}
		if (!form.rentAmount.trim() || isNaN(parseFloat(form.rentAmount))) {
			toast.error('Rent amount must be a valid number')
			return
		}
		if (parseFloat(form.rentAmount) <= 0) {
			toast.error('Rent amount must be greater than 0')
			return
		}
		if (!form.rentDueDay.trim() || isNaN(parseInt(form.rentDueDay, 10))) {
			toast.error('Rent due day must be a valid number')
			return
		}
		const dueDay = parseInt(form.rentDueDay, 10)
		if (dueDay < 1 || dueDay > 31) {
			toast.error('Rent due day must be between 1 and 31')
			return
		}

		// Validate optional numeric fields
		if (
			form.securityDepositHeld.trim() &&
			isNaN(parseFloat(form.securityDepositHeld))
		) {
			toast.error('Security deposit must be a valid number')
			return
		}
		if (
			form.lateFeeAmount.trim() &&
			isNaN(parseFloat(form.lateFeeAmount))
		) {
			toast.error('Late fee amount must be a valid number')
			return
		}
		if (
			form.noticePeriodDays.trim() &&
			isNaN(parseInt(form.noticePeriodDays, 10))
		) {
			toast.error('Notice period must be a valid number')
			return
		}

		// Validate date range
		const start = new Date(form.startDate)
		const end = new Date(form.endDate)
		if (end <= start) {
			toast.error('End date must be after start date')
			return
		}

		if (isEdit) {
			updateLease.mutate(
				{
					id: initialLease.id,
					payload: buildUpdatePayload(),
					unitId: form.unitId,
					propertyId: form.propertyId,
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
			createLease.mutate(buildCreatePayload(), {
				onSuccess: () => {
					toast.success('Lease created')
					setForm(initialFormState)
					onSuccess?.()
				},
				onError: (err) => {
					toast.error(err.message || 'Failed to create lease')
				},
			})
		}
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-4 pt-4">
			{!isEdit && (
				<div className="space-y-2">
					<Label htmlFor="leaseTemplateId">
						Template{' '}
						<span className="text-destructive" aria-hidden>
							*
						</span>
					</Label>
					<Select
						id="leaseTemplateId"
						name="leaseTemplateId"
						value={form.leaseTemplateId}
						onChange={handleChange}
						required
					>
						<option value="" disabled>
							Select a template
						</option>
						{activeTemplates?.map((t) => (
							<option key={t.id} value={t.id}>
								{t.name}
								{t.versionTag ? ` (${t.versionTag})` : ''}
							</option>
						))}
					</Select>
				</div>
			)}
			{!propertyId && (
				<div className="space-y-2">
					<Label htmlFor="propertyId">
						Property{' '}
						<span className="text-destructive" aria-hidden>
							*
						</span>
					</Label>
					<Select
						id="propertyId"
						name="propertyId"
						value={form.propertyId}
						onChange={handleChange}
						required
					>
						<option value="" disabled>
							Select a property
						</option>
						{propsList?.map((p) => (
							<option key={p.id} value={p.id}>
								{p.legalName}
							</option>
						))}
					</Select>
				</div>
			)}
			{!unitId && (
				<div className="space-y-2">
					<Label htmlFor="unitId">
						Unit{' '}
						<span className="text-destructive" aria-hidden>
							*
						</span>
					</Label>
					<Select
						id="unitId"
						name="unitId"
						value={form.unitId}
						onChange={handleChange}
						required
					>
						<option value="" disabled>
							Select a unit
						</option>
						{unitsList?.map((u) => (
							<option key={u.id} value={u.id}>
								{u.unitNumber}
							</option>
						))}
					</Select>
				</div>
			)}
			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-2">
					<Label htmlFor="startDate">
						Start date{' '}
						<span className="text-destructive" aria-hidden>
							*
						</span>
					</Label>
					<Input
						id="startDate"
						name="startDate"
						type="date"
						value={form.startDate}
						onChange={handleChange}
						required
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="endDate">
						End date{' '}
						<span className="text-destructive" aria-hidden>
							*
						</span>
					</Label>
					<Input
						id="endDate"
						name="endDate"
						type="date"
						value={form.endDate}
						onChange={handleChange}
						required
					/>
				</div>
			</div>
			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-2">
					<Label htmlFor="rentAmount">
						Rent amount ($){' '}
						<span className="text-destructive" aria-hidden>
							*
						</span>
					</Label>
					<Input
						id="rentAmount"
						name="rentAmount"
						type="number"
						min={0}
						step={0.01}
						value={form.rentAmount}
						onChange={handleChange}
						placeholder="1500.00"
						required
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="rentDueDay">
						Rent due day{' '}
						<span className="text-destructive" aria-hidden>
							*
						</span>
					</Label>
					<Input
						id="rentDueDay"
						name="rentDueDay"
						type="number"
						min={1}
						max={31}
						value={form.rentDueDay}
						onChange={handleChange}
						placeholder="1"
						required
					/>
				</div>
			</div>
			<div className="space-y-2">
				<Label htmlFor="securityDepositHeld">
					Security deposit held ($)
				</Label>
				<Input
					id="securityDepositHeld"
					name="securityDepositHeld"
					type="number"
					min={0}
					step={0.01}
					value={form.securityDepositHeld}
					onChange={handleChange}
					placeholder="Optional"
				/>
			</div>
			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-2">
					<Label htmlFor="lateFeeType">Late fee type</Label>
					<Select
						id="lateFeeType"
						name="lateFeeType"
						value={form.lateFeeType}
						onChange={handleChange}
					>
						<option value="">None</option>
						{LATE_FEE_TYPES.map((t) => (
							<option key={t} value={t}>
								{t.replace(/_/g, ' ')}
							</option>
						))}
					</Select>
				</div>
				<div className="space-y-2">
					<Label htmlFor="lateFeeAmount">Late fee amount</Label>
					<Input
						id="lateFeeAmount"
						name="lateFeeAmount"
						type="number"
						min={0}
						step={0.01}
						value={form.lateFeeAmount}
						onChange={handleChange}
						placeholder="Optional"
						disabled={!form.lateFeeType}
					/>
				</div>
			</div>
			<div className="space-y-2">
				<Label htmlFor="noticePeriodDays">Notice period (days)</Label>
				<Input
					id="noticePeriodDays"
					name="noticePeriodDays"
					type="number"
					min={0}
					value={form.noticePeriodDays}
					onChange={handleChange}
					placeholder="e.g. 30"
				/>
			</div>

			<DialogFooter>
				{onCancel && (
					<Button type="button" variant="outline" onClick={onCancel}>
						Cancel
					</Button>
				)}
				<Button type="submit" disabled={pending}>
					{pending ? 'Saving…' : submitLabel}
				</Button>
			</DialogFooter>
		</form>
	)
}
