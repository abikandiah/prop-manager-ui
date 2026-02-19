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
						onError: (err) =>
							toast.error(err.message || 'Failed to delete lease'),
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

	const [editingLease, setEditingLease] = useState<Lease | null>(null)
	const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(2)

	const handleEditClose = () => {
		setEditingLease(null)
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
			<div className="grid gap-x-8 gap-y-6 md:grid-cols-2 lg:grid-cols-3">
				{[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
					<div key={i} className="space-y-2">
						<Skeleton className="h-4 w-24" />
						<Skeleton className="h-6 w-full" />
					</div>
				))}
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
									setEditingLease(lease)
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

					{/* Detail grid */}
					<div className="grid gap-x-8 gap-y-6 md:grid-cols-2 lg:grid-cols-3">
						{/* Col 1: Template & property/unit */}
						<div className="space-y-6">
							<DetailField label="Template">
								{lease.leaseTemplateName || '—'}
								{lease.leaseTemplateVersionTag && (
									<span className="ml-2 text-xs text-muted-foreground">
										v{lease.leaseTemplateVersionTag}
									</span>
								)}
							</DetailField>
							<DetailField label="Property">
								{prop ? (
									<TextLink to="/props/$id" params={{ id: lease.propertyId }}>
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

						{/* Col 2: Financial terms */}
						<div className="space-y-6">
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
						</div>

						{/* Col 3: Lease terms & dates */}
						<div className="space-y-6">
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
						</div>

						{/* Late fee — full row on its own if present */}
						{(lease.lateFeeType || lease.lateFeeAmount != null) && (
							<div className="md:col-span-2 lg:col-span-3 border-t pt-4">
								<div className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
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
								</div>
							</div>
						)}

						{/* Template parameters */}
						{lease.templateParameters &&
							Object.keys(lease.templateParameters).length > 0 && (
								<div className="md:col-span-2 lg:col-span-3 border-t pt-4">
									<label className={DETAIL_LABEL_CLASS}>
										Template Parameters
									</label>
									<div className="mt-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

						{/* Metadata */}
						<div className="md:col-span-2 lg:col-span-3 border-t pt-4">
							<div className="grid gap-x-8 gap-y-4 sm:grid-cols-3">
								<DetailField label="Version">v{lease.version}</DetailField>
								<DetailField label="Created">
									{formatDate(lease.createdAt)}
								</DetailField>
								<DetailField label="Last Updated">
									{formatDate(lease.updatedAt)}
								</DetailField>
							</div>
						</div>

						{/* Executed content markdown */}
						{lease.executedContentMarkdown && (
							<div className="md:col-span-2 lg:col-span-3 border-t pt-4">
								<label className={DETAIL_LABEL_CLASS}>Lease Content</label>
								<div className="mt-2 rounded-md border bg-muted/20 p-6">
									<div className="prose prose-sm dark:prose-invert max-w-none">
										<ReactMarkdown>
											{lease.executedContentMarkdown}
										</ReactMarkdown>
									</div>
								</div>
							</div>
						)}
					</div>

					{/* Edit dialog (draft only) */}
					{editingLease && editingLease.status === LeaseStatus.DRAFT && (
						<FormDialog
							open={!!editingLease}
							onOpenChange={(open) => {
								if (!open) handleEditClose()
							}}
							title="Edit lease"
							description="Update lease details. Only draft leases can be edited."
							className="max-w-[calc(100vw-2rem)] sm:max-w-5xl"
							wizard={{
								currentStep: wizardStep,
								totalSteps: 3,
								stepTitle: WIZARD_STEP_TITLES[wizardStep],
								stepLabels: ['Details', 'Terms', 'Parameters'],
							}}
						>
							<LeaseAgreementFormWizard
								initialLease={editingLease}
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
