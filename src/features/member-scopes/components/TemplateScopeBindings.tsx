import { useMemo, useState } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@abumble/design-system/utils'
import { Button } from '@abumble/design-system/components/Button'
import { Label } from '@abumble/design-system/components/Label'
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
import { FieldError } from '@/components/ui/FieldError'
import { usePropsList } from '@/features/props'
import { useUnitsList } from '@/features/units'
import type { ScopeType } from '@/domain/member-scope'

// ---------- Helpers ----------

function toggleItem(ids: string[], id: string): string[] {
	return ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]
}

function formatTriggerLabel(
	ids: string[],
	singular: string,
	plural: string,
	resolveOne: (id: string) => string | undefined,
	isLoading: boolean,
): string {
	if (isLoading) return 'Loading…'
	if (ids.length === 0) return `Select ${plural}…`
	if (ids.length === 1) return resolveOne(ids[0]) ?? `1 ${singular}`
	return `${ids.length} ${plural} selected`
}

// ---------- Props ----------

export interface TemplateScopeBindingsProps {
	/** Which non-ORG scope types the selected template covers. Controls which pickers are shown. */
	templateScopeTypes: ScopeType[]
	propertyIds: string[]
	unitIds: string[]
	onPropertyIdsChange: (ids: string[]) => void
	onUnitIdsChange: (ids: string[]) => void
	errors?: {
		propertyIds?: { message?: string }
		unitIds?: { message?: string }
	}
}

// ---------- Component ----------

/**
 * Renders resource pickers (properties and/or units) based on the scope types
 * of a selected membership template. Pure binding rows — no permission configuration.
 */
export function TemplateScopeBindings({
	templateScopeTypes,
	propertyIds,
	unitIds,
	onPropertyIdsChange,
	onUnitIdsChange,
	errors,
}: TemplateScopeBindingsProps) {
	const { data: props, isLoading: propsLoading } = usePropsList()
	const { data: units, isLoading: unitsLoading } = useUnitsList()

	const [propComboOpen, setPropComboOpen] = useState(false)
	const [unitComboOpen, setUnitComboOpen] = useState(false)

	const needsPropertyPicker = templateScopeTypes.includes('PROPERTY')
	const needsUnitPicker = templateScopeTypes.includes('UNIT')

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

	if (!needsPropertyPicker && !needsUnitPicker) return null

	return (
		<div className="space-y-4">
			{needsPropertyPicker && (
				<div className="space-y-2">
					<Label>Which properties does this role apply to?</Label>
					<Popover open={propComboOpen} onOpenChange={setPropComboOpen}>
						<PopoverTrigger asChild>
							<Button
								type="button"
								variant="outline"
								role="combobox"
								aria-expanded={propComboOpen}
								className="w-full justify-between font-normal"
								disabled={propsLoading}
							>
								{formatTriggerLabel(
									propertyIds,
									'property',
									'properties',
									(id) => props?.find((p) => p.id === id)?.legalName,
									propsLoading,
								)}
								<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-full p-0">
							<Command>
								<CommandInput placeholder="Search properties…" />
								<CommandList>
									<CommandEmpty>No properties found.</CommandEmpty>
									<CommandGroup>
										{props?.map((p) => (
											<CommandItem
												key={p.id}
												value={p.legalName}
												onSelect={() =>
													onPropertyIdsChange(toggleItem(propertyIds, p.id))
												}
											>
												<Check
													className={cn(
														'mr-2 h-4 w-4',
														propertyIds.includes(p.id)
															? 'opacity-100'
															: 'opacity-0',
													)}
												/>
												{p.legalName}
											</CommandItem>
										))}
									</CommandGroup>
								</CommandList>
							</Command>
						</PopoverContent>
					</Popover>

					{propertyIds.length > 0 && (
						<ul className="flex flex-wrap gap-1">
							{propertyIds.map((id) => {
								const name = props?.find((p) => p.id === id)?.legalName ?? id
								return (
									<li
										key={id}
										className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
									>
										{name}
									</li>
								)
							})}
						</ul>
					)}

					<FieldError message={errors?.propertyIds?.message} />
				</div>
			)}

			{needsUnitPicker && (
				<div className="space-y-2">
					<Label>Which units does this role apply to?</Label>
					<Popover open={unitComboOpen} onOpenChange={setUnitComboOpen}>
						<PopoverTrigger asChild>
							<Button
								type="button"
								variant="outline"
								role="combobox"
								aria-expanded={unitComboOpen}
								className="w-full justify-between font-normal"
								disabled={unitsLoading}
							>
								{formatTriggerLabel(
									unitIds,
									'unit',
									'units',
									(id) => units?.find((u) => u.id === id)?.unitNumber,
									unitsLoading,
								)}
								<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-full p-0">
							<Command>
								<CommandInput placeholder="Search units…" />
								<CommandList>
									<CommandEmpty>No units found.</CommandEmpty>
									{unitsByProperty.map((group) => (
										<CommandGroup key={group.propId} heading={group.propName}>
											{group.units.map((u) => (
												<CommandItem
													key={u.id}
													value={`${u.unitNumber} ${group.propName}`}
													onSelect={() =>
														onUnitIdsChange(toggleItem(unitIds, u.id))
													}
												>
													<Check
														className={cn(
															'mr-2 h-4 w-4',
															unitIds.includes(u.id)
																? 'opacity-100'
																: 'opacity-0',
														)}
													/>
													{u.unitNumber}
												</CommandItem>
											))}
										</CommandGroup>
									))}
								</CommandList>
							</Command>
						</PopoverContent>
					</Popover>

					{unitIds.length > 0 && (
						<ul className="flex flex-wrap gap-1">
							{unitIds.map((id) => {
								const unit = units?.find((u) => u.id === id)
								const propName = unit
									? (props?.find((p) => p.id === unit.propertyId)?.legalName ??
										'')
									: ''
								return (
									<li
										key={id}
										className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
									>
										{unit?.unitNumber ?? id}
										{propName && (
											<span className="ml-1 text-muted-foreground">
												· {propName}
											</span>
										)}
									</li>
								)
							})}
						</ul>
					)}

					<FieldError message={errors?.unitIds?.message} />
				</div>
			)}
		</div>
	)
}
