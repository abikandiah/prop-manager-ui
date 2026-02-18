import { useState } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { Input } from '@abumble/design-system/components/Input'
import { Label } from '@abumble/design-system/components/Label'
import { Select } from '@abumble/design-system/components/Select'
import { Button } from '@abumble/design-system/components/Button'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@abumble/design-system/components/Table'
import { Trash2 } from 'lucide-react'
import type { LeaseFormValues } from './LeaseAgreementFormWizard'
import { FieldError } from '@/components/ui/FieldError'
import { usePropsList } from '@/features/props'
import { useUnitsList } from '@/features/units'
import { useLeaseTemplatesActive } from '@/features/lease-templates'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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
		if (!trimmed || !EMAIL_REGEX.test(trimmed)) return
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
					Template{' '}
					<span className="text-destructive" aria-hidden>
						*
					</span>
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
					Property{' '}
					<span className="text-destructive" aria-hidden>
						*
					</span>
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
					Unit{' '}
					<span className="text-destructive" aria-hidden>
						*
					</span>
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
					Tenant emails{' '}
					<span className="text-destructive" aria-hidden>
						*
					</span>
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
					<div className="rounded border overflow-hidden mt-1">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Email</TableHead>
									<TableHead className="w-10" />
								</TableRow>
							</TableHeader>
							<TableBody>
								{tenantEmails.map((email) => (
									<TableRow key={email}>
										<TableCell className="text-sm">{email}</TableCell>
										<TableCell className="text-right">
											<button
												type="button"
												onClick={() => handleRemoveEmail(email)}
												className="text-muted-foreground hover:text-destructive transition-colors"
												aria-label={`Remove ${email}`}
											>
												<Trash2 className="h-4 w-4" />
											</button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				)}
			</div>

			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-2">
					<Label htmlFor="startDate">
						Start date{' '}
						<span className="text-destructive" aria-hidden>
							*
						</span>
					</Label>
					<Input id="startDate" {...register('startDate')} type="date" />
					<FieldError message={errors.startDate?.message} />
				</div>
				<div className="space-y-2">
					<Label htmlFor="endDate">
						End date{' '}
						<span className="text-destructive" aria-hidden>
							*
						</span>
					</Label>
					<Input id="endDate" {...register('endDate')} type="date" />
					<FieldError message={errors.endDate?.message} />
				</div>
			</div>
		</div>
	)
}
