import { useCallback, useMemo, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Input } from '@abumble/design-system/components/Input'
import { Label } from '@abumble/design-system/components/Label'
import { ChevronDown, ChevronRight } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import type { LeaseFormValues } from './LeaseAgreementFormWizard'
import {
	SYSTEM_PARAMETERS,
	buildLeaseSystemParameters,
} from '@/features/lease-templates/constants'
import { usePropsList } from '@/features/props'
import { useUnitsList } from '@/features/units'

interface LeaseParametersStepProps {
	templateMarkdown: string
}

export function LeaseParametersStep({
	templateMarkdown,
}: LeaseParametersStepProps) {
	const { watch, setValue } = useFormContext<LeaseFormValues>()
	const templateParameters = watch('templateParameters')
	const propertyId = watch('propertyId')
	const unitId = watch('unitId')
	const startDate = watch('startDate')
	const endDate = watch('endDate')
	const rentAmount = watch('rentAmount')
	const rentDueDay = watch('rentDueDay')
	const securityDepositHeld = watch('securityDepositHeld')

	const { data: propsList } = usePropsList()
	const { data: unitsList } = useUnitsList()

	const selectedProp = useMemo(
		() => propsList?.find((p) => p.id === propertyId),
		[propsList, propertyId],
	)
	const selectedUnit = useMemo(
		() => unitsList?.find((u) => u.id === unitId),
		[unitsList, unitId],
	)

	const systemParameters = useMemo(
		() =>
			buildLeaseSystemParameters({
				propertyName: selectedProp?.legalName,
				unitNumber: selectedUnit?.unitNumber,
				startDate,
				endDate,
				rentAmount,
				rentDueDay,
				securityDeposit: securityDepositHeld || undefined,
			}),
		[
			selectedProp,
			selectedUnit,
			startDate,
			endDate,
			rentAmount,
			rentDueDay,
			securityDepositHeld,
		],
	)

	// Only show system params that are actually used in the template markdown
	const usedSystemParams = useMemo(
		() =>
			SYSTEM_PARAMETERS.filter(({ key }) => {
				const regex = new RegExp(`{{\\s*${key}\\s*}}`)
				return regex.test(templateMarkdown)
			}),
		[templateMarkdown],
	)

	const handleParameterChange = useCallback(
		(key: string, value: string) => {
			setValue('templateParameters', { ...templateParameters, [key]: value })
		},
		[templateParameters, setValue],
	)

	const previewMarkdown = useMemo(() => {
		let rendered = templateMarkdown
		// Substitute system params first
		Object.entries(systemParameters).forEach(([key, value]) => {
			const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
			rendered = rendered.replace(regex, value)
		})
		// Then substitute custom template params
		Object.entries(templateParameters).forEach(([key, value]) => {
			const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
			rendered = rendered.replace(regex, value || `{{${key}}}`)
		})
		return rendered
	}, [templateMarkdown, systemParameters, templateParameters])

	const [systemParamsCollapsed, setSystemParamsCollapsed] = useState(true)

	const parameterKeys = Object.keys(templateParameters)
	const hasCustomParams = parameterKeys.length > 0
	const hasUsedSystemParams = usedSystemParams.length > 0

	if (!hasCustomParams && !hasUsedSystemParams) {
		return (
			<div className="text-center py-8 text-muted-foreground">
				This template has no custom parameters to fill in.
			</div>
		)
	}

	return (
		<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<div className="space-y-4">
				{/* Custom parameters — user-editable, primary */}
				{hasCustomParams && (
					<div className="space-y-3">
						<div className="text-sm font-medium text-foreground">
							Fill in template parameters
						</div>
						<div className="grid gap-3">
							{parameterKeys.map((key) => (
								<div key={key} className="space-y-2">
									<Label
										htmlFor={`param-${key}`}
										className="font-mono text-xs"
									>
										{'{{'}
										{key}
										{'}}'}
									</Label>
									<Input
										id={`param-${key}`}
										value={templateParameters[key] || ''}
										onChange={(e) => handleParameterChange(key, e.target.value)}
										placeholder={`Enter ${key}`}
									/>
								</div>
							))}
						</div>
					</div>
				)}

				{/* System parameters — read-only, collapsible */}
				{hasUsedSystemParams && (
					<div className="space-y-2">
						<button
							type="button"
							onClick={() => setSystemParamsCollapsed((c) => !c)}
							className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-full text-left"
						>
							{systemParamsCollapsed ? (
								<ChevronRight className="h-3.5 w-3.5 shrink-0" />
							) : (
								<ChevronDown className="h-3.5 w-3.5 shrink-0" />
							)}
							System parameters
						</button>
						{!systemParamsCollapsed && (
							<div className="grid gap-1.5">
								{usedSystemParams.map(({ key }) => {
									const value = systemParameters[key]
									return (
										<div
											key={key}
											className="flex items-center justify-between rounded-md bg-muted/30 border px-3 py-2 gap-3"
										>
											<span className="font-mono text-xs text-muted-foreground shrink-0">
												{'{{'}
												{key}
												{'}}'}
											</span>
											<span className="text-sm text-right truncate">
												{value ?? (
													<span className="font-mono text-xs text-muted-foreground">
														{'{{'}
														{key}
														{'}}'}
													</span>
												)}
											</span>
										</div>
									)
								})}
							</div>
						)}
					</div>
				)}
			</div>

			<div className="space-y-2">
				<div className="text-sm font-medium text-foreground">Lease preview</div>
				<div className="rounded-md border bg-muted/20 p-4 h-[min(calc(100vh-22rem),28rem)] overflow-y-auto lg:h-full lg:max-h-[45vh]">
					<div className="prose prose-sm dark:prose-invert max-w-none">
						<ReactMarkdown>{previewMarkdown}</ReactMarkdown>
					</div>
				</div>
			</div>
		</div>
	)
}
