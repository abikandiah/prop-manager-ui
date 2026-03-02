import { cn } from '@abumble/design-system/utils'
import { Select } from '@abumble/design-system/components/Select'
import { Label } from '@abumble/design-system/components/Label'
import { FieldError } from '@/components/ui/FieldError'
import { PermissionMatrixEditor } from '@/features/permission-policies/components/PermissionMatrixEditor'
import { PermissionPolicySelect } from '@/features/permission-policies/components/PermissionPolicySelect'
import { usePropsList } from '@/features/props'
import { useUnitsList } from '@/features/units'
import type { AssignmentConfigValue } from '@/domain/policy-assignment'
import { ResourceType } from '@/domain/policy-assignment'

export interface AssignmentConfiguratorProps {
	orgId: string
	value: AssignmentConfigValue
	onChange: (value: AssignmentConfigValue) => void
	errors?: {
		resourceType?: { message?: string }
		resourceId?: { message?: string }
		overrides?: { message?: string }
	}
	/** Unique id used to namespace the policy/custom radio group. */
	groupId?: string
}

/**
 * Controls for configuring a single policy assignment:
 * resource type + resource picker (2-column) + policy or custom permissions.
 */
export function AssignmentConfigurator({
	orgId,
	value,
	onChange,
	errors,
	groupId = 'default',
}: AssignmentConfiguratorProps) {
	const { data: props } = usePropsList()
	const { data: units } = useUnitsList()

	const handleResourceTypeChange = (type: ResourceType) => {
		onChange({
			...value,
			resourceType: type,
			resourceId: type === ResourceType.ORG ? orgId : '',
		})
	}

	const showResourcePicker = value.resourceType !== ResourceType.ORG

	return (
		<div className="space-y-4">
			{/* Resource type + resource picker — side by side when a picker is needed */}
			<div
				className={cn(
					'grid gap-3',
					showResourcePicker ? 'grid-cols-2' : 'grid-cols-1',
				)}
			>
				<div className="space-y-2">
					<Label>Resource type</Label>
					<Select
						value={value.resourceType}
						onChange={(e) =>
							handleResourceTypeChange(e.target.value as ResourceType)
						}
					>
						<option value={ResourceType.ORG}>Organization</option>
						<option value={ResourceType.PROPERTY}>Property</option>
						<option value={ResourceType.UNIT}>Unit</option>
					</Select>
					<FieldError message={errors?.resourceType?.message} />
				</div>

				{value.resourceType === ResourceType.PROPERTY && (
					<div className="space-y-2">
						<Label>Property</Label>
						<Select
							value={value.resourceId}
							onChange={(e) =>
								onChange({ ...value, resourceId: e.target.value })
							}
						>
							<option value="">— Select a property —</option>
							{props?.map((p) => (
								<option key={p.id} value={p.id}>
									{p.legalName}
								</option>
							))}
						</Select>
						<FieldError message={errors?.resourceId?.message} />
					</div>
				)}

				{value.resourceType === ResourceType.UNIT && (
					<div className="space-y-2">
						<Label>Unit</Label>
						<Select
							value={value.resourceId}
							onChange={(e) =>
								onChange({ ...value, resourceId: e.target.value })
							}
						>
							<option value="">— Select a unit —</option>
							{units?.map((u) => (
								<option key={u.id} value={u.id}>
									{u.unitNumber}
								</option>
							))}
						</Select>
						<FieldError message={errors?.resourceId?.message} />
					</div>
				)}
			</div>

			{/* Policy or custom permissions */}
			<div className="space-y-4">
				<div className="flex items-center gap-4">
					<Label className="flex items-center gap-2 cursor-pointer">
						<input
							type="radio"
							name={`permMode-${groupId}`}
							checked={value.usePolicy}
							onChange={() => onChange({ ...value, usePolicy: true })}
						/>
						Use a policy
					</Label>
					<Label className="flex items-center gap-2 cursor-pointer">
						<input
							type="radio"
							name={`permMode-${groupId}`}
							checked={!value.usePolicy}
							onChange={() => onChange({ ...value, usePolicy: false })}
						/>
						Custom permissions
					</Label>
				</div>

				{value.usePolicy ? (
					<div className="space-y-2">
						<Label>Policy</Label>
						<PermissionPolicySelect
							orgId={orgId}
							value={value.policyId ?? ''}
							onChange={(id) =>
								onChange({ ...value, policyId: id || undefined })
							}
						/>
					</div>
				) : (
					<div className="space-y-2">
						<Label>Permissions</Label>
						<PermissionMatrixEditor
							value={value.overrides}
							onChange={(perms) => onChange({ ...value, overrides: perms })}
						/>
						<FieldError message={errors?.overrides?.message} />
					</div>
				)}
			</div>
		</div>
	)
}
