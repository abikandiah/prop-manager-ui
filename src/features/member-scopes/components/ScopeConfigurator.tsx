import { useMemo, useState } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@abumble/design-system/utils'
import { Button } from '@abumble/design-system/components/Button'
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from '@/components/ui/command'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@abumble/design-system/components/Popover'
import { Select } from '@abumble/design-system/components/Select'
import { Label } from '@abumble/design-system/components/Label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RequiredMark } from '@/components/ui'
import { FieldError } from '@/components/ui/FieldError'
import {
	PermissionMatrixEditor,
	PermissionTemplateSelect,
	usePermissionTemplateDetail,
} from '@/features/permission-templates'
import { usePropsList } from '@/features/props'
import { useUnitsList } from '@/features/units'
import type { ScopeConfigValue, ScopeType } from '@/domain/member-scope'
import { getTemplatePermissions, normalizePermString } from '@/features/member-scopes/utils'

export interface ScopeConfiguratorProps {
	orgId: string
	value: ScopeConfigValue
	onChange: (value: ScopeConfigValue) => void
	errors?: {
		scopeType?: { message?: string }
		scopeId?: { message?: string }
		templateId?: { message?: string }
		permissions?: { message?: string }
	}
	/** If true, scope type and resource ID cannot be changed (edit mode). */
	lockedResource?: boolean
	/** Baseline permissions from the membership's primary template/role. */
	globalInheritedPermissions?: Record<string, string>
}

export function ScopeConfigurator({
	orgId,
	value,
	onChange,
	errors,
	lockedResource = false,
	globalInheritedPermissions = {},
}: ScopeConfiguratorProps) {
	const { data: props, isLoading: propsLoading } = usePropsList()
	const { data: units, isLoading: unitsLoading } = useUnitsList()
	const [unitComboOpen, setUnitComboOpen] = useState(false)

	// Fetch selected local template (if any) to show inherited permissions
	const { data: localTemplate } = usePermissionTemplateDetail(
		value.useTemplate ? (value.templateId ?? null) : null,
	)

	// Calculate net inherited permissions: Global Baseline + Local Template
	const netInheritedPermissions = useMemo(() => {
		const local = getTemplatePermissions(localTemplate, value.scopeType)
		const merged = { ...globalInheritedPermissions }
		Object.entries(local).forEach(([domain, actions]) => {
			const current = merged[domain] ?? ''
			const unique = actions.split('').filter((a) => !current.includes(a)).join('')
			merged[domain] = normalizePermString(current + unique)
		})
		return merged
	}, [localTemplate, value.scopeType, globalInheritedPermissions])

	// Group units by property for the searchable grouped combobox
	const unitsByProperty = useMemo(() => {
		if (!units) return []
		const groups = new Map<string, typeof units>()
		for (const u of units) {
			const arr = groups.get(u.propertyId) ?? []
			arr.push(u)
			groups.set(u.propertyId, arr)
		}
		return Array.from(groups.entries()).map(([propId, propUnits]) => ({
			propId,
			propName: props?.find((p) => p.id === propId)?.legalName ?? propId,
			units: propUnits,
		}))
	}, [units, props])

	const handleTypeChange = (type: ScopeType) => {
		onChange({
			...value,
			scopeType: type,
			scopeId: type === 'ORG' ? orgId : '',
		})
	}

	const handleResourceChange = (id: string) => {
		onChange({ ...value, scopeId: id })
	}

	const handleModeChange = (mode: string) => {
		const useTemplate = mode === 'template'
		onChange({
			...value,
			useTemplate,
			permissions: useTemplate ? {} : value.permissions,
			templateId: useTemplate ? value.templateId : undefined,
		})
	}

	const handleTemplateChange = (templateId: string) => {
		onChange({ ...value, templateId })
	}

	const handlePermissionsChange = (permissions: Record<string, string>) => {
		onChange({ ...value, permissions })
	}

	return (
		<div className="space-y-4">
			{/* Resource Selection */}
			<div className="grid gap-4 sm:grid-cols-2">
				<div className="space-y-2">
					<Label>Scope Level <RequiredMark /></Label>
					<Select
						value={value.scopeType}
						onChange={(e) => handleTypeChange(e.target.value as ScopeType)}
						disabled={lockedResource}
					>
						<option value="ORG">Organization</option>
						<option value="PROPERTY">Property</option>
						<option value="UNIT">Unit</option>
					</Select>
					<FieldError message={errors?.scopeType?.message} />
				</div>

				{value.scopeType !== 'ORG' && (
					<div className="space-y-2">
						<Label>
							{value.scopeType === 'PROPERTY' ? 'Property' : 'Unit'} <RequiredMark />
						</Label>
						{value.scopeType === 'PROPERTY' ? (
							<Select
								value={value.scopeId}
								onChange={(e) => handleResourceChange(e.target.value)}
								disabled={lockedResource || propsLoading}
							>
								{propsLoading
									? <option>Loading…</option>
									: <>
											<option value="">Select a property...</option>
											{props?.map((p) => (
												<option key={p.id} value={p.id}>{p.legalName}</option>
											))}
										</>
								}
							</Select>
						) : (
							<Popover open={unitComboOpen} onOpenChange={setUnitComboOpen}>
								<PopoverTrigger asChild>
									<Button
										type="button"
										variant="outline"
										role="combobox"
										aria-expanded={unitComboOpen}
										className="w-full justify-between font-normal"
										disabled={lockedResource || unitsLoading}
									>
										{unitsLoading
											? 'Loading…'
											: (units?.find((u) => u.id === value.scopeId)?.unitNumber ?? 'Select a unit...')}
										<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
									</Button>
								</PopoverTrigger>
								<PopoverContent className="w-full p-0">
									<Command>
										<CommandInput placeholder="Search units..." />
										<CommandList>
											<CommandEmpty>No units found.</CommandEmpty>
											{unitsByProperty.map((group) => (
												<CommandGroup key={group.propId} heading={group.propName}>
													{group.units.map((u) => (
														<CommandItem
															key={u.id}
															value={`${u.unitNumber} ${group.propName}`}
															onSelect={() => {
																handleResourceChange(u.id)
																setUnitComboOpen(false)
															}}
														>
															<Check className={cn('mr-2 h-4 w-4', value.scopeId === u.id ? 'opacity-100' : 'opacity-0')} />
															{u.unitNumber}
														</CommandItem>
													))}
												</CommandGroup>
											))}
										</CommandList>
									</Command>
								</PopoverContent>
							</Popover>
						)}
						<FieldError message={errors?.scopeId?.message} />
					</div>
				)}
			</div>

			{/* Configuration Mode Toggle */}
			<div className="space-y-3">
				<Label>Access Configuration</Label>
				<Tabs
					value={value.useTemplate ? 'template' : 'manual'}
					onValueChange={handleModeChange}
					className="w-full"
				>
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="template">Use Role / Template</TabsTrigger>
						<TabsTrigger value="manual">Custom Permissions</TabsTrigger>
					</TabsList>
				</Tabs>
			</div>

			{/* Template Selection */}
			{value.useTemplate ? (
				<div className="space-y-2">
					<Label>Select Role <RequiredMark /></Label>
					<PermissionTemplateSelect
						id="template-select"
						orgId={orgId}
						value={value.templateId ?? ''}
						onChange={handleTemplateChange}
					/>
					<FieldError message={errors?.templateId?.message} />

					{/* Template Preview */}
					{value.templateId && (
						<div className="mt-2 space-y-1">
							<p className="text-xs text-muted-foreground">
								Permissions granted by this role:
							</p>
							<PermissionMatrixEditor
								value={{}}
								inheritedPermissions={netInheritedPermissions}
								readOnly
							/>
						</div>
					)}
				</div>
			) : (
				/* Manual Permissions */
				<div className="space-y-2">
					<Label>Define Permissions <RequiredMark /></Label>
					<PermissionMatrixEditor
						value={value.permissions}
						onChange={handlePermissionsChange}
						inheritedPermissions={netInheritedPermissions}
					/>
					<FieldError message={errors?.permissions?.message} />
				</div>
			)}
		</div>
	)
}
