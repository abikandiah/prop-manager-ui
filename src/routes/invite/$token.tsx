import { CenteredEmptyState } from '@/components/CenteredEmptyState'
import { DetailField, TextLink } from '@/components/ui'
import { FormActions, FormCard } from '@/components/ui/FormCard'
import { config } from '@/config'
import type { User } from '@/contexts/auth'
import { useAuth } from '@/contexts/auth'
import { useAcceptInvite, useInvitePreview } from '@/features/invites/hooks'
import {
	InviteStatus,
	TargetType,
	type InvitePreviewResponse,
	type LeaseInvitePreview,
	type MembershipInvitePreview,
} from '@/features/invites/types'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/format'
import { MessageBanner } from '@abumble/design-system/components/Banner'
import { Button } from '@abumble/design-system/components/Button'
import { DelayedLoadingFallback } from '@abumble/design-system/components/DelayedLoadingFallback'
import { Skeleton } from '@abumble/design-system/components/Skeleton'
import { createFileRoute } from '@tanstack/react-router'
import { Building2, Home } from 'lucide-react'
import * as React from 'react'

export const Route = createFileRoute('/invite/$token')({
	component: InviteAcceptPage,
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_TITLE: Record<InviteStatus, string> = {
	[InviteStatus.PENDING]: 'Accept your invite',
	[InviteStatus.REVOKED]: 'Invite revoked',
	[InviteStatus.EXPIRED]: 'Invite expired',
	[InviteStatus.ACCEPTED]: 'Invite accepted',
}

function formatPropertyAddress(
	property: LeaseInvitePreview['property'],
): string {
	return [
		property.addressLine1,
		property.addressLine2,
		`${property.city}, ${property.stateProvinceRegion} ${property.postalCode}`,
	]
		.filter(Boolean)
		.join(', ')
}

// ─── Route component ──────────────────────────────────────────────────────────

function InviteAcceptPage() {
	const { token } = Route.useParams()
	const { user, isLoadingUser } = useAuth()

	const { data: preview, isLoading, isError } = useInvitePreview(token)
	const acceptInvite = useAcceptInvite()

	const handleAccept = () => {
		acceptInvite.mutate(token)
	}

	const isPageLoading = isLoading || isLoadingUser

	return (
		<div className="flex flex-1 flex-col">
			<div className="mx-auto w-full max-w-5xl">
				<DelayedLoadingFallback
					isLoading={isPageLoading}
					delayMs={config.loadingFallbackDelayMs}
					fallback={<InvitePageSkeleton />}
				>
					{isError || !preview ? (
						<CenteredEmptyState
							title="Invite not found"
							description="This link may be invalid or expired."
							action={<TextLink to="/">Back to home</TextLink>}
						/>
					) : (
						<InvitePageContent
							preview={preview}
							user={user}
							onAccept={handleAccept}
							isAccepting={acceptInvite.isPending}
						/>
					)}
				</DelayedLoadingFallback>
			</div>
		</div>
	)
}

// ─── Page content ─────────────────────────────────────────────────────────────

interface InvitePageContentProps {
	preview: InvitePreviewResponse
	user: User | null
	onAccept: () => void
	isAccepting: boolean
}

function InvitePageContent({
	preview,
	user,
	onAccept,
	isAccepting,
}: InvitePageContentProps) {
	const {
		maskedEmail,
		expiresAt,
		invitedByName,
		status,
		targetType,
		preview: snapshot,
	} = preview

	const isPending = status === InviteStatus.PENDING
	const isLease = targetType === TargetType.LEASE
	const leaseSnapshot = isLease ? (snapshot as LeaseInvitePreview) : null
	const membershipSnapshot = !isLease
		? (snapshot as MembershipInvitePreview)
		: null

	return (
		<div className="flex flex-col gap-6">
			{/* Page header */}
			<div className="flex flex-col gap-1">
				<p className="text-sm text-muted-foreground">
					Invited by{' '}
					<span className="font-medium text-foreground">{invitedByName}</span>
				</p>
				<h1 className="text-2xl font-semibold text-foreground">
					{isLease
						? "You've been invited to join as a tenant"
						: `You've been invited to join ${membershipSnapshot?.organizationName}`}
				</h1>
				{isLease && leaseSnapshot && (
					<div className="flex items-center gap-1.5 text-sm text-muted-foreground">
						<Home className="size-3.5 shrink-0" />
						<span>{leaseSnapshot.property.legalName}</span>
						{leaseSnapshot.property.addressLine1 && (
							<>
								<span>·</span>
								<span>{formatPropertyAddress(leaseSnapshot.property)}</span>
							</>
						)}
					</div>
				)}
				{!isLease && membershipSnapshot && (
					<div className="flex items-center gap-1.5 text-sm text-muted-foreground">
						<Building2 className="size-3.5 shrink-0" />
						<span>{membershipSnapshot.organizationName}</span>
					</div>
				)}
			</div>

			{/* Detail cards — only shown when invite is still pending */}
			{isPending && isLease && leaseSnapshot && (
				<div className="flex flex-col gap-4">
					<DetailCard>
						<div className="grid gap-4 sm:grid-cols-2">
							<DetailField label="Unit">
								{leaseSnapshot.unit.unitNumber}
								{leaseSnapshot.unit.unitType
									? ` · ${leaseSnapshot.unit.unitType}`
									: ''}
							</DetailField>
							<DetailField label="Sent to">{maskedEmail}</DetailField>
						</div>
					</DetailCard>

					<DetailCard>
						<div className="grid gap-4 sm:grid-cols-3">
							<DetailField
								label="Monthly Rent"
								valueClassName="text-lg font-semibold text-foreground"
							>
								{formatCurrency(leaseSnapshot.lease.rentAmount)}
							</DetailField>
							<DetailField label="Lease Start">
								{formatDate(leaseSnapshot.lease.startDate)}
							</DetailField>
							<DetailField label="Lease End">
								{formatDate(leaseSnapshot.lease.endDate)}
							</DetailField>
						</div>
					</DetailCard>
				</div>
			)}

			{isPending && !isLease && membershipSnapshot && (
				<DetailCard>
					<div className="grid gap-4 sm:grid-cols-2">
						<DetailField label="Organization">
							{membershipSnapshot.organizationName}
						</DetailField>
						<DetailField label="Sent to">{maskedEmail}</DetailField>
					</div>
				</DetailCard>
			)}

			{/* Action card */}
			<div className="flex justify-center mt-8">
				<InviteActionCard
					status={status}
					targetType={targetType}
					organizationName={membershipSnapshot?.organizationName}
					user={user}
					maskedEmail={maskedEmail}
					expiresAt={expiresAt}
					onAccept={onAccept}
					isAccepting={isAccepting}
				/>
			</div>
		</div>
	)
}

// ─── Shared detail card wrapper ───────────────────────────────────────────────

function DetailCard({ children }: { children: React.ReactNode }) {
	return <div className="rounded border bg-card px-5 py-4">{children}</div>
}

// ─── Action card ──────────────────────────────────────────────────────────────

interface InviteActionCardProps {
	status: InviteStatus
	targetType: TargetType
	organizationName?: string
	user: User | null
	maskedEmail: string
	expiresAt: string
	onAccept: () => void
	isAccepting: boolean
}

function InviteActionCard({
	status,
	targetType,
	organizationName,
	user,
	expiresAt,
	onAccept,
	isAccepting,
}: InviteActionCardProps) {
	const isLease = targetType === TargetType.LEASE
	const canAccept = status === InviteStatus.PENDING

	return (
		<FormCard
			title={STATUS_TITLE[status]}
			description={
				<ActionCardDescription
					status={status}
					targetType={targetType}
					organizationName={organizationName}
					expiresAt={expiresAt}
				/>
			}
		>
			{canAccept && (
				<div className="space-y-4">
					{user && (
						<MessageBanner
							type={'info'}
							message={
								<div className="flex-1 min-w-0 text-left">
									<p className="font-medium truncate">
										Accepting as {user.email}
									</p>
								</div>
							}
						/>
					)}

					<FormActions fullWidth>
						<Button
							onClick={onAccept}
							disabled={isAccepting}
							aria-busy={isAccepting}
						>
							{isAccepting ? 'Joining...' : 'Accept Invite'}
						</Button>
					</FormActions>

					{isLease && (
						<p className="text-xs text-muted-foreground text-center">
							Accepting this invite is not the same as signing the lease.
						</p>
					)}
				</div>
			)}
		</FormCard>
	)
}

// ─── Action card description ──────────────────────────────────────────────────

interface ActionCardDescriptionProps {
	status: InviteStatus
	targetType: TargetType
	organizationName?: string
	expiresAt: string
}

function ActionCardDescription({
	status,
	targetType,
	organizationName,
	expiresAt,
}: ActionCardDescriptionProps) {
	const isLease = targetType === TargetType.LEASE

	if (status === InviteStatus.PENDING) {
		return (
			<div>
				<p>
					{isLease
						? 'Accept the invite to join this lease as a tenant. You will be able to discuss and review the lease with property management.'
						: `Accept the invite to join ${organizationName} as a member.`}
				</p>
				<p className="mt-3">This invite expires {formatDateTime(expiresAt)}</p>
			</div>
		)
	}

	return (
		<span role="status" aria-live="polite">
			{status === InviteStatus.REVOKED &&
				'This invite is no longer valid and cannot be accepted.'}
			{status === InviteStatus.EXPIRED &&
				`This invite expired on ${formatDateTime(expiresAt)}.`}
			{status === InviteStatus.ACCEPTED &&
				'This invite has already been accepted.'}
		</span>
	)
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function InvitePageSkeleton() {
	return (
		<div className="flex flex-col gap-6">
			{/* Header */}
			<div className="flex flex-col gap-2">
				<Skeleton className="h-3.5 w-36" />
				<Skeleton className="h-8 w-80" />
				<Skeleton className="h-3.5 w-56" />
			</div>

			{/* Detail cards */}
			<div className="flex flex-col gap-4">
				<div className="rounded border bg-card px-5 py-4">
					<div className="grid gap-4 sm:grid-cols-2">
						{Array.from({ length: 2 }).map((_, i) => (
							<div key={i} className="space-y-2">
								<Skeleton className="h-3 w-16" />
								<Skeleton className="h-5 w-28" />
							</div>
						))}
					</div>
				</div>
				<div className="rounded border bg-card px-5 py-4">
					<div className="grid gap-4 sm:grid-cols-3">
						{Array.from({ length: 3 }).map((_, i) => (
							<div key={i} className="space-y-2">
								<Skeleton className="h-3 w-20" />
								<Skeleton className="h-5 w-24" />
							</div>
						))}
					</div>
				</div>
			</div>

			{/* Action card */}
			<div className="flex justify-center mt-8">
				<div className="w-full max-w-md rounded border bg-card px-6 py-8 flex flex-col gap-6">
					<div className="space-y-2">
						<Skeleton className="h-8 w-48" />
						<Skeleton className="h-4 w-full" />
						<Skeleton className="h-4 w-3/4" />
					</div>
					<Skeleton className="h-10 w-full" />
				</div>
			</div>
		</div>
	)
}
