import { useState } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { z } from 'zod'
import { X } from 'lucide-react'
import { Input } from '@abumble/design-system/components/Input'
import { Label } from '@abumble/design-system/components/Label'
import { Select } from '@abumble/design-system/components/Select'
import { Button } from '@abumble/design-system/components/Button'
import type { LeaseFormValues } from './LeaseAgreementFormWizard'
import { FieldError } from '@/components/ui/FieldError'
import { RequiredMark } from '@/components/ui'
import { usePropsList } from '@/features/props'
import { useUnitsList } from '@/features/units'
import { useLeaseTemplatesActive } from '@/features/lease-templates'

const isValidEmail = (value: string) => z.email().safeParse(value).success

export function LeaseDetailsStep() {
	const {
		register,
		watch,
		control,
		setValue,
		formState: { errors },
	} = useFormContext<LeaseFormValues>()

	const { data: propsList } = usePropsList()
	const { data: unitsList } = useUnitsList()
	const { data: activeTemplates } = useLeaseTemplatesActive()

	const [emailInput, setEmailInput] = useState('')
	const propertyId = watch('propertyId')
	const tenantEmails = watch('tenantEmails')

	const handleAddEmail = () => {
		const trimmed = emailInput.trim().toLowerCase()
		if (!trimmed || !isValidEmail(trimmed)) return
		if (!tenantEmails.includes(trimmed)) {
			setValue('tenantEmails', [...tenantEmails, trimmed], {
				shouldValidate: true,
			})
			setEmailInput('')
		}
	}

	const handleRemoveEmail = (email: string) => {
		setValue(
			'tenantEmails',
			tenantEmails.filter((e) => e !== email),
			{ shouldValidate: true },
		)
	}

	const handleEmailKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter') {
			e.preventDefault()
			handleAddEmail()
		}
	}

	return (
		<div className="space-y-4">
			<div className="space-y-2">
				<Label htmlFor="leaseTemplateId">
					Template <RequiredMark />
				</Label>
				<Select id="leaseTemplateId" {...register('leaseTemplateId')}>
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
				<FieldError message={errors.leaseTemplateId?.message} />
			</div>

			<div className="space-y-2">
				<Label htmlFor="propertyId">
					Property <RequiredMark />
				</Label>
				<Controller
					name="propertyId"
					control={control}
					render={({ field }) => (
						<Select
							id="propertyId"
							value={field.value}
							onChange={(e) => {
								field.onChange(e.target.value)
								// Clear dependent unit when property changes
								setValue('unitId', '')
							}}
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
					)}
				/>
				<FieldError message={errors.propertyId?.message} />
			</div>

			<div className="space-y-2">
				<Label htmlFor="unitId">
					Unit <RequiredMark />
				</Label>
				<Select id="unitId" {...register('unitId')}>
					<option value="" disabled>
						Select a unit
					</option>
					{unitsList
						?.filter((u) => !propertyId || u.propertyId === propertyId)
						.map((u) => (
							<option key={u.id} value={u.id}>
								{u.unitNumber}
							</option>
						))}
				</Select>
				<FieldError message={errors.unitId?.message} />
			</div>

			<div className="space-y-2">
				<Label htmlFor="tenantEmailInput">
					Tenant emails <RequiredMark />
				</Label>
				<div className="flex gap-2">
					<Input
						id="tenantEmailInput"
						type="email"
						value={emailInput}
						onChange={(e) => setEmailInput(e.target.value)}
						onKeyDown={handleEmailKeyDown}
						placeholder="tenant@example.com"
					/>
					<Button type="button" onClick={handleAddEmail} variant="outline">
						Add
					</Button>
				</div>
				<FieldError message={errors.tenantEmails?.message} />
				{tenantEmails.length > 0 && (
					<div className="flex flex-wrap gap-1.5 mt-1">
						{tenantEmails.map((email) => (
							<span
								key={email}
								className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs font-medium text-foreground"
							>
								{email}
								<button
									type="button"
									onClick={() => handleRemoveEmail(email)}
									aria-label={`Remove ${email}`}
									className="text-muted-foreground hover:text-destructive transition-colors ml-0.5"
								>
									<X className="h-3 w-3" />
								</button>
							</span>
						))}
					</div>
				)}
			</div>

			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-2">
					<Label htmlFor="startDate">
						Start date <RequiredMark />
					</Label>
					<Input id="startDate" {...register('startDate')} type="date" />
					<FieldError message={errors.startDate?.message} />
				</div>
				<div className="space-y-2">
					<Label htmlFor="endDate">
						End date <RequiredMark />
					</Label>
					<Input id="endDate" {...register('endDate')} type="date" />
					<FieldError message={errors.endDate?.message} />
				</div>
			</div>
		</div>
	)
}
