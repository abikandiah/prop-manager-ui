import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@abumble/design-system/components/Button'
import { Input } from '@abumble/design-system/components/Input'
import type {
	CreateLeaseTemplatePayload,
	LeaseTemplate,
	UpdateLeaseTemplatePayload,
} from '@/domain/lease-template'
import type { LateFeeType } from '@/domain/lease'
import { LATE_FEE_TYPES } from '@/domain/lease'
import { Checkbox } from '@/components/ui/checkbox'
import { DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import {
	useCreateLeaseTemplate,
	useUpdateLeaseTemplate,
} from '@/features/lease-templates/hooks'

type FormState = {
	name: string
	versionTag: string
	templateMarkdown: string
	defaultLateFeeType: LateFeeType | ''
	defaultLateFeeAmount: string
	defaultNoticePeriodDays: string
	active: boolean
}

const initialFormState: FormState = {
	name: '',
	versionTag: '',
	templateMarkdown: '',
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

export interface LeaseTemplateFormProps {
	initialTemplate?: LeaseTemplate | null
	onSuccess?: (data?: LeaseTemplate) => void
	onCancel?: () => void
	submitLabel?: string
}

export function LeaseTemplateForm({
	initialTemplate = null,
	onSuccess,
	onCancel,
	submitLabel = 'Create Template',
}: LeaseTemplateFormProps) {
	const isEdit = initialTemplate != null
	const [form, setForm] = useState<FormState>(() =>
		initialTemplate ? templateToFormState(initialTemplate) : initialFormState,
	)
	const createTemplate = useCreateLeaseTemplate()
	const updateTemplate = useUpdateLeaseTemplate()

	useEffect(() => {
		if (initialTemplate) {
			setForm(templateToFormState(initialTemplate))
		} else {
			setForm(initialFormState)
		}
	}, [initialTemplate])

	const pending = createTemplate.isPending || updateTemplate.isPending

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
	) => {
		const { name, value } = e.target
		setForm((prev) => ({
			...prev,
			[name]:
				name === 'defaultLateFeeType'
					? (value as LateFeeType | '')
					: value,
		}))
	}

	const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setForm((prev) => ({ ...prev, templateMarkdown: e.target.value }))
	}

	const buildCreatePayload = (): CreateLeaseTemplatePayload => ({
		name: form.name.trim(),
		versionTag: form.versionTag.trim() || undefined,
		templateMarkdown: form.templateMarkdown.trim(),
		defaultLateFeeType: form.defaultLateFeeType || undefined,
		defaultLateFeeAmount: form.defaultLateFeeAmount.trim()
			? parseFloat(form.defaultLateFeeAmount)
			: undefined,
		defaultNoticePeriodDays: form.defaultNoticePeriodDays.trim()
			? parseInt(form.defaultNoticePeriodDays, 10)
			: undefined,
	})

	const buildUpdatePayload = (): UpdateLeaseTemplatePayload => ({
		name: form.name.trim() || undefined,
		versionTag: form.versionTag.trim() || undefined,
		templateMarkdown: form.templateMarkdown.trim() || undefined,
		defaultLateFeeType: form.defaultLateFeeType || undefined,
		defaultLateFeeAmount: form.defaultLateFeeAmount.trim()
			? parseFloat(form.defaultLateFeeAmount)
			: undefined,
		defaultNoticePeriodDays: form.defaultNoticePeriodDays.trim()
			? parseInt(form.defaultNoticePeriodDays, 10)
			: undefined,
		active: form.active,
		version: initialTemplate?.version ?? 0,
	})

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()

		if (!form.name.trim()) {
			toast.error('Template name is required')
			return
		}

		if (!form.templateMarkdown.trim()) {
			toast.error('Template markdown is required')
			return
		}

		// Validate numeric fields
		if (
			form.defaultLateFeeAmount.trim() &&
			isNaN(parseFloat(form.defaultLateFeeAmount))
		) {
			toast.error('Default late fee amount must be a valid number')
			return
		}
		if (
			form.defaultNoticePeriodDays.trim() &&
			(isNaN(parseInt(form.defaultNoticePeriodDays, 10)) ||
				parseInt(form.defaultNoticePeriodDays, 10) < 1)
		) {
			toast.error('Notice period must be at least 1 day')
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
					onSuccess?.()
				},
				onError: (err) => {
					toast.error(err.message || 'Failed to create template')
				},
			})
		}
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-4 pt-4">
			<div className="space-y-2">
				<Label htmlFor="name">
					Template name{' '}
					<span className="text-destructive" aria-hidden>
						*
					</span>
				</Label>
				<Input
					id="name"
					name="name"
					value={form.name}
					onChange={handleChange}
					placeholder="e.g. Ontario Residential Standard 2026"
					maxLength={255}
					required
				/>
			</div>

			<div className="space-y-2">
				<Label htmlFor="versionTag">Version tag (optional)</Label>
				<Input
					id="versionTag"
					name="versionTag"
					value={form.versionTag}
					onChange={handleChange}
					placeholder="e.g. v2.1"
					maxLength={50}
				/>
			</div>

			<div className="space-y-2">
				<Label htmlFor="templateMarkdown">
					Template markdown{' '}
					<span className="text-destructive" aria-hidden>
						*
					</span>
				</Label>
				<textarea
					id="templateMarkdown"
					value={form.templateMarkdown}
					onChange={handleTextareaChange}
					placeholder="Use {{property_name}}, {{unit_number}}, {{start_date}}, {{end_date}}, {{rent_amount}}, {{rent_due_day}}, {{security_deposit}} as placeholders"
					required
					rows={12}
					className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
				/>
				<p className="text-sm text-muted-foreground">
					Available placeholders: {'{'}
					{'{'}property_name{'}'}{'}'}
					, {'{{'}unit_number{'}}'}
					, {'{{'}start_date{'}}'}
					, {'{{'}end_date{'}}'}
					, {'{{'}rent_amount{'}}'}
					, {'{{'}rent_due_day{'}}'}
					, {'{{'}security_deposit{'}}'}
				</p>
			</div>

			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-2">
					<Label htmlFor="defaultLateFeeType">Default late fee type</Label>
					<Select
						id="defaultLateFeeType"
						name="defaultLateFeeType"
						value={form.defaultLateFeeType}
						onChange={handleChange}
					>
						<option value="">None</option>
						{LATE_FEE_TYPES.map((type) => (
							<option key={type} value={type}>
								{type.replace(/_/g, ' ')}
							</option>
						))}
					</Select>
				</div>

				<div className="space-y-2">
					<Label htmlFor="defaultLateFeeAmount">Default late fee amount</Label>
					<Input
						id="defaultLateFeeAmount"
						name="defaultLateFeeAmount"
						type="number"
						min={0}
						step={0.01}
						value={form.defaultLateFeeAmount}
						onChange={handleChange}
						placeholder="Optional"
					/>
				</div>
			</div>

			<div className="space-y-2">
				<Label htmlFor="defaultNoticePeriodDays">
					Default notice period (days)
				</Label>
				<Input
					id="defaultNoticePeriodDays"
					name="defaultNoticePeriodDays"
					type="number"
					min={1}
					value={form.defaultNoticePeriodDays}
					onChange={handleChange}
					placeholder="Optional"
				/>
			</div>

			{isEdit && (
				<div className="flex items-center gap-2">
					<Checkbox
						id="active"
						checked={form.active}
						onCheckedChange={(checked) =>
							setForm((prev) => ({ ...prev, active: checked === true }))
						}
					/>
					<Label htmlFor="active" className="cursor-pointer font-normal">
						Active (available when creating new leases)
					</Label>
				</div>
			)}

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
