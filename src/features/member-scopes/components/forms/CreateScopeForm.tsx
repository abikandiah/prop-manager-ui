import { useCallback, useMemo, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { z } from 'zod'
import { toast } from 'sonner'
import { Check, ChevronsUpDown } from 'lucide-react'
import { Button } from '@abumble/design-system/components/Button'
import { DialogFooter } from '@abumble/design-system/components/Dialog'
import { Label } from '@abumble/design-system/components/Label'
import { Select } from '@abumble/design-system/components/Select'
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
import { cn } from '@abumble/design-system/utils'
import {
	PermissionMatrixEditor,
	usePermissionTemplateDetail,
} from '@/features/permission-templates'
import { useMembershipById } from '@/features/memberships'
import { useCreateMemberScope } from '@/features/member-scopes/hooks'
import { FieldError } from '@/components/ui/FieldError'
import { RequiredMark } from '@/components/ui'
import { usePropsList } from '@/features/props'
import { useUnitsList } from '@/features/units'
import { getTemplatePermissions } from '@/features/member-scopes/utils'
import type { ScopeType } from '@/domain/member-scope'

// ---------- Schema ----------

const createScopeSchema = z
	.object({
		scopeType: z.enum(['ORG', 'PROPERTY', 'UNIT']),
		scopeId: z.string(),
		customizePermissions: z.boolean(),
		permissions: z.record(z.string(), z.string()),
	})
	.refine(
		(data) => data.scopeType === 'ORG' || data.scopeId.trim().length > 0,
		{ message: 'Select a resource', path: ['scopeId'] },
	)
	.refine(
		(data) =>
			!data.customizePermissions ||
			Object.values(data.permissions).some((v) => v.trim() !== ''),
		{ message: 'Grant at least one permission', path: ['permissions'] },
	)

type FormValues = z.infer<typeof createScopeSchema>

// ---------- Props ----------

export interface CreateScopeFormProps {
	orgId: string
	membershipId: string
	onSuccess?: () => void
	onCancel?: () => void
}

// ---------- Component ----------

export function CreateScopeForm({
	orgId,
	membershipId,
	onSuccess,
	onCancel,
}: CreateScopeFormProps) {
	const createScope = useCreateMemberScope()
	const [unitComboOpen, setUnitComboOpen] = useState(false)

	const { data: props, isLoading: propsLoading } = usePropsList()
	const { data: units, isLoading: unitsLoading } = useUnitsList()

	// Membership template — shows which permissions are already inherited at this scope level
	const { data: membership } = useMembershipById(orgId, membershipId)
	const { data: membershipTemplate } = usePermissionTemplateDetail(
		membership?.membershipTemplateId ?? null,
	)

	const {
		control,
		register,
		handleSubmit,
		watch,
		formState: { errors },
	} = useForm<FormValues>({
		resolver: standardSchemaResolver(createScopeSchema),
		defaultValues: {
			scopeType: 'PROPERTY',
			scopeId: '',
			customizePermissions: false,
			permissions: {},
		},
		mode: 'onTouched',
	})

	const scopeType = watch('scopeType')
	const customizePermissions = watch('customizePermissions')

	const inheritedPermissions = useMemo(
		() => getTemplatePermissions(membershipTemplate, scopeType as ScopeType),
		[membershipTemplate, scopeType],
	)

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

	const onSubmit = useCallback(
		(values: FormValues) => {
			const resolvedScopeId =
				values.scopeType === 'ORG' ? orgId : values.scopeId.trim()

			createScope.mutate(
				{
					orgId,
					membershipId,
					payload: {
						scopeType: values.scopeType as ScopeType,
						scopeId: resolvedScopeId,
						permissions: values.customizePermissions ? values.permissions : undefined,
					},
				},
				{
					onSuccess: () => {
						toast.success('Scope added')
						onSuccess?.()
					},
				},
			)
		},
		[orgId, membershipId, createScope, onSuccess],
	)

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-4">
			{/* Scope Level + Resource */}
			<div className="grid gap-4 sm:grid-cols-2">
				<div className="space-y-2">
					<Label htmlFor="scope-type">
						Scope level <RequiredMark />
					</Label>
					<Select id="scope-type" {...register('scopeType')}>
						<option value="PROPERTY">Property</option>
						<option value="UNIT">Unit</option>
						<option value="ORG">Organization</option>
					</Select>
				</div>

				{scopeType !== 'ORG' && (
					<div className="space-y-2">
						<Label>
							{scopeType === 'PROPERTY' ? 'Property' : 'Unit'} <RequiredMark />
						</Label>

						{scopeType === 'PROPERTY' ? (
							<Controller
								name="scopeId"
								control={control}
								render={({ field }) => (
									<Select
										value={field.value}
										onChange={(e) => field.onChange(e.target.value)}
										disabled={propsLoading}
									>
										{propsLoading ? (
											<option>Loading…</option>
										) : (
											<>
												<option value="">Select a property…</option>
												{props?.map((p) => (
													<option key={p.id} value={p.id}>
														{p.legalName}
													</option>
												))}
											</>
										)}
									</Select>
								)}
							/>
						) : (
							<Controller
								name="scopeId"
								control={control}
								render={({ field }) => (
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
												{unitsLoading
													? 'Loading…'
													: (units?.find((u) => u.id === field.value)
															?.unitNumber ?? 'Select a unit…')}
												<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
											</Button>
										</PopoverTrigger>
										<PopoverContent className="w-full p-0">
											<Command>
												<CommandInput placeholder="Search units…" />
												<CommandList>
													<CommandEmpty>No units found.</CommandEmpty>
													{unitsByProperty.map((group) => (
														<CommandGroup
															key={group.propId}
															heading={group.propName}
														>
															{group.units.map((u) => (
																<CommandItem
																	key={u.id}
																	value={`${u.unitNumber} ${group.propName}`}
																	onSelect={() => {
																		field.onChange(u.id)
																		setUnitComboOpen(false)
																	}}
																>
																	<Check
																		className={cn(
																			'mr-2 h-4 w-4',
																			field.value === u.id
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
								)}
							/>
						)}
						<FieldError message={errors.scopeId?.message} />
					</div>
				)}
			</div>

			{/* Inherited permissions preview */}
			{Object.keys(inheritedPermissions).length > 0 && (
				<div className="space-y-2 rounded-md border bg-muted/30 p-3">
					<p className="text-xs font-medium text-muted-foreground">
						Already granted by the membership role
					</p>
					<PermissionMatrixEditor
						value={{}}
						inheritedPermissions={inheritedPermissions}
						readOnly
					/>
				</div>
			)}

			{/* Override permissions toggle */}
			<div className="space-y-3">
				<Controller
					name="customizePermissions"
					control={control}
					render={({ field }) => (
						<label
							htmlFor="customize-toggle"
							className="flex items-center gap-3 cursor-pointer"
						>
							<input
								id="customize-toggle"
								type="checkbox"
								className="h-4 w-4 rounded border-input accent-primary"
								checked={field.value}
								onChange={(e) => field.onChange(e.target.checked)}
							/>
							<span className="text-sm">Override permissions for this scope</span>
						</label>
					)}
				/>

				{customizePermissions && (
					<div className="space-y-2">
						<Controller
							name="permissions"
							control={control}
							render={({ field }) => (
								<PermissionMatrixEditor
									value={field.value}
									onChange={field.onChange}
									inheritedPermissions={inheritedPermissions}
								/>
							)}
						/>
						<FieldError
							message={(errors.permissions as { message?: string } | undefined)?.message}
						/>
					</div>
				)}
			</div>

			<DialogFooter className="gap-2">
				{onCancel && (
					<Button type="button" variant="outline" onClick={onCancel}>
						Cancel
					</Button>
				)}
				<Button type="submit" disabled={createScope.isPending}>
					{createScope.isPending ? (
						'Saving…'
					) : (
						<>
							<Check className="h-4 w-4" />
							Add scope
						</>
					)}
				</Button>
			</DialogFooter>
		</form>
	)
}
