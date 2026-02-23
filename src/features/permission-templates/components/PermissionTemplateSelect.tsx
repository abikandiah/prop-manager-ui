import { Select } from '@abumble/design-system/components/Select'
import { usePermissionTemplates } from '../hooks'
import type { PermissionTemplate } from '@/domain/permission-template'

export interface PermissionTemplateSelectProps {
	orgId: string
	value: string
	onChange: (templateId: string) => void
	disabled?: boolean
	id?: string
}

/**
 * Dropdown for selecting a permission template.
 * Groups templates as "System" (org-independent) and "Organization" (org-scoped).
 * Calls onChange with the selected template ID, or '' when cleared.
 */
export function PermissionTemplateSelect({
	orgId,
	value,
	onChange,
	disabled,
	id,
}: PermissionTemplateSelectProps) {
	const { data: templates, isLoading } = usePermissionTemplates(orgId)

	const systemTemplates: Array<PermissionTemplate> =
		templates?.filter((t) => t.orgId === null) ?? []
	const orgTemplates: Array<PermissionTemplate> =
		templates?.filter((t) => t.orgId !== null) ?? []

	return (
		<Select
			id={id}
			value={value}
			onChange={(e) => onChange(e.target.value)}
			disabled={disabled || isLoading}
		>
			<option value="">— Select a template —</option>
			{systemTemplates.length > 0 && (
				<optgroup label="System">
					{systemTemplates.map((t) => (
						<option key={t.id} value={t.id}>
							{t.name}
						</option>
					))}
				</optgroup>
			)}
			{orgTemplates.length > 0 && (
				<optgroup label="Organization">
					{orgTemplates.map((t) => (
						<option key={t.id} value={t.id}>
							{t.name}
						</option>
					))}
				</optgroup>
			)}
		</Select>
	)
}
