import { useState } from 'react'
import { Input } from '@abumble/design-system/components/Input'
import { Label } from '@abumble/design-system/components/Label'
import { Select } from '@abumble/design-system/components/Select'
import { Button } from '@abumble/design-system/components/Button'
import { X } from 'lucide-react'
import { usePropsList } from '@/features/props'
import { useUnitsList } from '@/features/units'
import { useLeaseTemplatesActive } from '@/features/lease-templates'

interface LeaseDetailsStepProps {
	leaseTemplateId: string
	propertyId: string
	unitId: string
	tenantEmails: Array<string>
	startDate: string
	endDate: string
	onFieldChange: (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
	) => void
	onTenantEmailsChange: (emails: Array<string>) => void
}

export function LeaseDetailsStep({
	leaseTemplateId,
	propertyId,
	unitId,
	tenantEmails,
	startDate,
	endDate,
	onFieldChange,
	onTenantEmailsChange,
}: LeaseDetailsStepProps) {
	const { data: propsList } = usePropsList()
	const { data: unitsList } = useUnitsList()
	const { data: activeTemplates } = useLeaseTemplatesActive()
	const [emailInput, setEmailInput] = useState('')

	const handleAddEmail = () => {
		const trimmed = emailInput.trim().toLowerCase()
		if (!trimmed) return

		// Basic email validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
		if (!emailRegex.test(trimmed)) {
			return
		}

		if (!tenantEmails.includes(trimmed)) {
			onTenantEmailsChange([...tenantEmails, trimmed])
			setEmailInput('')
		}
	}

	const handleRemoveEmail = (email: string) => {
		onTenantEmailsChange(tenantEmails.filter((e) => e !== email))
	}

	const handleEmailInputKeyDown = (
		e: React.KeyboardEvent<HTMLInputElement>,
	) => {
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
				<Select
					id="leaseTemplateId"
					name="leaseTemplateId"
					value={leaseTemplateId}
					onChange={onFieldChange}
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
					value={propertyId}
					onChange={onFieldChange}
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
					value={unitId}
					onChange={onFieldChange}
					required
				>
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
			</div>

			<div className="space-y-2">
				<Label htmlFor="tenantEmails">
					Tenant Emails{' '}
					<span className="text-destructive" aria-hidden>
						*
					</span>
				</Label>
				<div className="flex gap-2">
					<Input
						id="tenantEmails"
						type="email"
						value={emailInput}
						onChange={(e) => setEmailInput(e.target.value)}
						onKeyDown={handleEmailInputKeyDown}
						placeholder="Enter tenant email"
					/>
					<Button type="button" onClick={handleAddEmail} variant="outline">
						Add
					</Button>
				</div>
				{tenantEmails.length > 0 && (
					<div className="flex flex-wrap gap-2 mt-2">
						{tenantEmails.map((email) => (
							<div
								key={email}
								className="flex items-center gap-1 bg-muted/30 border border-border/50 rounded-md px-2 py-1 text-sm"
							>
								<span>{email}</span>
								<button
									type="button"
									onClick={() => handleRemoveEmail(email)}
									className="text-muted-foreground hover:text-foreground"
								>
									<X className="h-3 w-3" />
								</button>
							</div>
						))}
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
					<Input
						id="startDate"
						name="startDate"
						type="date"
						value={startDate}
						onChange={onFieldChange}
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
						value={endDate}
						onChange={onFieldChange}
						required
					/>
				</div>
			</div>
		</div>
	)
}
