import { CenteredEmptyState } from '@/components/CenteredEmptyState'
import {
	DETAIL_LABEL_CLASS,
	DetailField,
	EntityActions,
	TextLink,
} from '@/components/ui'
import { config } from '@/config'
import type { Lease } from '@/domain/lease'
import { LateFeeType, LeaseStatus } from '@/domain/lease'
import {
	LeaseAgreementFormWizard,
	LeaseTenantsList,
	LeaseStatusActions,
	useDeleteLease,
	useLeaseDetail,
} from '@/features/leases'
import { usePropDetail } from '@/features/props'
import { useUnitDetail } from '@/features/units'
import { formatCurrency, formatDate, formatEnumLabel } from '@/lib/format'
import { Badge } from '@abumble/design-system/components/Badge'
import { BannerHeader } from '@abumble/design-system/components/BannerHeader'
import { DelayedLoadingFallback } from '@abumble/design-system/components/DelayedLoadingFallback'
import { FormDialog } from '@abumble/design-system/components/Dialog'
import { Skeleton } from '@abumble/design-system/components/Skeleton'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { FORM_DIALOG_CLASS_WIDE, useEditDialogState } from '@/lib/dialog'
import ReactMarkdown from 'react-markdown'
import { toast } from 'sonner'

export const Route = createFileRoute('/leases/agreements/$leaseId')({
	component: LeaseDetailPage,
})

const WIZARD_STEP_TITLES: Record<1 | 2 | 3, string> = {
	1: 'Details',
	2: 'Terms',
	3: 'Parameters',
}

function statusVariant(status: LeaseStatus) {
	switch (status) {
		case LeaseStatus.ACTIVE:
			return 'success'
		case LeaseStatus.DRAFT:
			return 'secondary'
		case LeaseStatus.REVIEW:
			return 'warning'
		case LeaseStatus.TERMINATED:
		case LeaseStatus.EVICTED:
			return 'destructive'
		default:
			return 'default'
	}
}

function LeaseActions({ lease, onEdit }: { lease: Lease; onEdit: () => void }) {
	const navigate = useNavigate()
	const deleteLease = useDeleteLease()

	return (
		<EntityActions
			label="Lease actions"
			onEdit={lease.status === LeaseStatus.DRAFT ? onEdit : undefined}
			onDelete={() => {
				deleteLease.mutate(
					{ id: lease.id, unitId: lease.unitId, propertyId: lease.propertyId },
					{
						onSuccess: () => {
							toast.success('Lease deleted')
							navigate({ to: '/leases/agreements' })
						},
					},
				)
			}}
			isDeletePending={deleteLease.isPending}
			deleteTitle="Delete lease?"
			deleteDescription="This lease will be permanently removed. This can't be undone."
		/>
	)
}

function LeaseDetailPage() {
	const { leaseId } = Route.useParams()

	const { data: lease, isLoading, isError, error } = useLeaseDetail(leaseId)

	const { data: prop } = usePropDetail(lease?.propertyId ?? null)
	const { data: unit } = useUnitDetail(lease?.unitId ?? null)

	const editDialog = useEditDialogState<Lease>()
	const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(2)

	const handleEditClose = () => {
		editDialog.close()
		setWizardStep(2)
	}

	useEffect(() => {
		if (isError) {
			toast.error(`Error loading lease: ${error.message || 'Unknown'}`)
		}
	}, [isError, error])

	const skeleton = (
		<div className="flex flex-col gap-6">
			<div className="flex items-center gap-2">
				<Skeleton className="h-9 w-9 rounded" />
				<Skeleton className="h-8 w-48" />
			</div>
			<div className="flex gap-2">
				<Skeleton className="h-6 w-20 rounded-full" />
			</div>
			<div className="grid gap-4 lg:grid-cols-[1fr_260px]">
				<div className="flex flex-col gap-4">
					{[3, 3, 3].map((count, si) => (
						<div key={si} className="rounded-lg border bg-card px-5 py-4">
							<Skeleton className="mb-4 h-3 w-32" />
							<div className="grid gap-4 sm:grid-cols-2">
								{Array.from({ length: count }).map((_, i) => (
									<div key={i} className="space-y-2">
										<Skeleton className="h-3 w-20" />
										<Skeleton className="h-5 w-full" />
									</div>
								))}
							</div>
						</div>
					))}
				</div>
				<div className="rounded-lg border bg-card px-5 py-4">
					<Skeleton className="mb-4 h-3 w-24" />
					<div className="flex flex-col gap-4">
						{[1, 2, 3].map((i) => (
							<div key={i} className="space-y-2">
								<Skeleton className="h-3 w-16" />
								<Skeleton className="h-5 w-full" />
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	)

	return (
		<DelayedLoadingFallback
			isLoading={isLoading}
			delayMs={config.loadingFallbackDelayMs}
			fallback={skeleton}
		>
			{isError || !lease ? (
				<CenteredEmptyState
					title="Lease not found"
					description={
						isError
							? error.message || 'Failed to load lease'
							: 'The lease you were looking for was not found.'
					}
					action={
						<TextLink to="/leases/agreements">Back to agreements</TextLink>
					}
				/>
			) : (
				<div className="flex flex-col gap-6">
					<BannerHeader
						linkComponent={Link}
						backLink={{
							label: 'Back to agreements',
							to: '/leases/agreements',
						}}
						title={
							lease.leaseTemplateName
								? `${lease.leaseTemplateName}${unit ? ` · Unit ${unit.unitNumber}` : ''}`
								: `Lease${unit ? ` · Unit ${unit.unitNumber}` : ''}`
						}
						description={[
							prop?.legalName,
							lease.leaseTemplateVersionTag &&
								`v${lease.leaseTemplateVersionTag}`,
							`${formatDate(lease.startDate)} – ${formatDate(lease.endDate)}`,
						]
							.filter(Boolean)
							.join(' · ')}
						actions={
							<LeaseActions
								lease={lease}
								onEdit={() => {
									setWizardStep(2)
									editDialog.edit(lease)
								}}
							/>
						}
					/>

					{/* Status + actions row */}
					<div className="flex flex-wrap items-center gap-3">
						<Badge variant={statusVariant(lease.status)}>
							{formatEnumLabel(lease.status)}
						</Badge>
						<LeaseStatusActions lease={lease} />
					</div>

					{/* Two-column body */}
					<div className="grid gap-4 lg:grid-cols-[1fr_260px]">
						{/* Left: main detail sections */}
						<div className="flex flex-col gap-4">
							{/* Property & Unit */}
							<div className="rounded-lg border bg-card px-5 py-4">
								<div className="grid gap-4 sm:grid-cols-2">
									<DetailField label="Property">
										{prop ? (
											<TextLink
												to="/props/$id"
												params={{ id: lease.propertyId }}
											>
												{prop.legalName}
											</TextLink>
										) : (
											'—'
										)}
									</DetailField>
									<DetailField label="Unit">
										{unit ? (
											<TextLink
												to="/units/$unitId"
												params={{ unitId: lease.unitId }}
											>
												Unit {unit.unitNumber}
											</TextLink>
										) : (
											'—'
										)}
									</DetailField>
								</div>
							</div>

							{/* Lease Period, Financial Terms & Late Fees */}
							<div className="rounded-lg border bg-card px-5 py-4">
								<div className="grid gap-4 sm:grid-cols-3">
									<DetailField
										label="Monthly Rent"
										valueClassName="text-lg font-semibold text-foreground"
									>
										{formatCurrency(lease.rentAmount)}
									</DetailField>
									<DetailField label="Rent Due Day">
										{lease.rentDueDay
											? `Day ${lease.rentDueDay} of each month`
											: '—'}
									</DetailField>
									<DetailField label="Security Deposit">
										{lease.securityDepositHeld != null
											? formatCurrency(lease.securityDepositHeld)
											: '—'}
									</DetailField>
									<DetailField label="Start Date">
										{formatDate(lease.startDate)}
									</DetailField>
									<DetailField label="End Date">
										{formatDate(lease.endDate)}
									</DetailField>
									<DetailField label="Notice Period">
										{lease.noticePeriodDays != null
											? `${lease.noticePeriodDays} days`
											: '—'}
									</DetailField>
									{(lease.lateFeeType || lease.lateFeeAmount != null) && (
										<>
											<DetailField label="Late Fee Type">
												{lease.lateFeeType
													? formatEnumLabel(lease.lateFeeType)
													: '—'}
											</DetailField>
											<DetailField label="Late Fee Amount">
												{lease.lateFeeAmount != null
													? lease.lateFeeType === LateFeeType.PERCENTAGE
														? `${lease.lateFeeAmount}%`
														: formatCurrency(lease.lateFeeAmount)
													: '—'}
											</DetailField>
										</>
									)}
								</div>
							</div>

							{/* Tenants */}
							<LeaseTenantsList
								leaseId={lease.id}
								isDraft={lease.status === LeaseStatus.DRAFT}
							/>

							{/* Template & Parameters — conditional */}
							{(lease.leaseTemplateName ||
								(lease.templateParameters &&
									Object.keys(lease.templateParameters).length > 0)) && (
								<div className="rounded-lg border bg-card px-5 py-4">
									<DetailField label="Template">
										{lease.leaseTemplateName || '—'}
										{lease.leaseTemplateVersionTag && (
											<span className="ml-2 text-xs text-muted-foreground">
												v{lease.leaseTemplateVersionTag}
											</span>
										)}
									</DetailField>
									{lease.templateParameters &&
										Object.keys(lease.templateParameters).length > 0 && (
											<div className="mt-4">
												<p className={`${DETAIL_LABEL_CLASS} mb-3`}>
													Parameters
												</p>
												<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
													{Object.entries(lease.templateParameters).map(
														([key, value]) => (
															<div
																key={key}
																className="rounded-md border bg-muted/30 p-3"
															>
																<p className="text-xs font-mono text-muted-foreground">
																	{'{{'}
																	{key}
																	{'}}'}
																</p>
																<p className="mt-1 text-sm font-medium text-foreground">
																	{value || '—'}
																</p>
															</div>
														),
													)}
												</div>
											</div>
										)}
								</div>
							)}
						</div>

						{/* Right: metadata sidebar */}
						<div className="flex flex-col gap-4">
							<div className="rounded-lg border bg-card px-5 py-4">
								<div className="flex flex-col gap-4">
									<DetailField label="Version">v{lease.version}</DetailField>
									<DetailField label="Created">
										{formatDate(lease.createdAt)}
									</DetailField>
									<DetailField label="Last Updated">
										{formatDate(lease.updatedAt)}
									</DetailField>
								</div>
							</div>
						</div>
					</div>

					{/* Executed content markdown — full width */}
					{lease.executedContentMarkdown && (
						<div className="rounded-lg bg-card px-5 py-4">
							<div className="prose prose-sm dark:prose-invert max-w-none">
								<ReactMarkdown>{lease.executedContentMarkdown}</ReactMarkdown>
							</div>
						</div>
					)}

					{/* Edit dialog (draft only) */}
					{editDialog.editing &&
						editDialog.editing.status === LeaseStatus.DRAFT && (
							<FormDialog
								open={editDialog.isOpen}
								onOpenChange={(open) => {
									if (!open) handleEditClose()
								}}
								title="Edit lease"
								description="Update lease details. Only draft leases can be edited."
								className={FORM_DIALOG_CLASS_WIDE}
								wizard={{
									currentStep: wizardStep,
									totalSteps: 3,
									stepTitle: WIZARD_STEP_TITLES[wizardStep],
									stepLabels: ['Details', 'Terms', 'Parameters'],
								}}
							>
								<LeaseAgreementFormWizard
									initialLease={editDialog.editing}
									step={wizardStep}
									onStepChange={setWizardStep}
									onSuccess={handleEditClose}
									onCancel={handleEditClose}
									submitLabel="Save"
								/>
							</FormDialog>
						)}
				</div>
			)}
		</DelayedLoadingFallback>
	)
}
