import { Select } from '@abumble/design-system/components/Select'
import { usePermissionPolicies } from '../hooks'
import type { PermissionPolicy } from '@/domain/permission-policy'

export interface PermissionPolicySelectProps {
	orgId: string
	value: string
	onChange: (policyId: string) => void
	disabled?: boolean
	id?: string
}

/**
 * Dropdown for selecting a permission policy.
 * Groups policies as "System" (org-independent) and "Organization" (org-scoped).
 * Calls onChange with the selected policy ID, or '' when cleared.
 */
export function PermissionPolicySelect({
	orgId,
	value,
	onChange,
	disabled,
	id,
}: PermissionPolicySelectProps) {
	const { data: policies, isLoading } = usePermissionPolicies(orgId)

	const systemPolicies: Array<PermissionPolicy> =
		policies?.filter((p) => p.orgId === null) ?? []
	const orgPolicies: Array<PermissionPolicy> =
		policies?.filter((p) => p.orgId !== null) ?? []

	return (
		<Select
			id={id}
			value={value}
			onChange={(e) => onChange(e.target.value)}
			disabled={disabled || isLoading}
		>
			<option value="">— Select a policy —</option>
			{systemPolicies.length > 0 && (
				<optgroup label="System">
					{systemPolicies.map((p) => (
						<option key={p.id} value={p.id}>
							{p.name}
						</option>
					))}
				</optgroup>
			)}
			{orgPolicies.length > 0 && (
				<optgroup label="Organization">
					{orgPolicies.map((p) => (
						<option key={p.id} value={p.id}>
							{p.name}
						</option>
					))}
				</optgroup>
			)}
		</Select>
	)
}
