import { CenteredEmptyState } from '@/components/CenteredEmptyState'
import { RegisterForm } from '@/components/RegisterForm'
import { DetailField, TextLink } from '@/components/ui'
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
import { Button } from '@abumble/design-system/components/Button'
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '@abumble/design-system/components/Card'
import { DelayedLoadingFallback } from '@abumble/design-system/components/DelayedLoadingFallback'
import { Skeleton } from '@abumble/design-system/components/Skeleton'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Building2, Home } from 'lucide-react'
import { toast } from 'sonner'

export const Route = createFileRoute('/invite/$token')({
	component: InviteAcceptPage,
})

function InviteAcceptPage() {
	const { token } = Route.useParams()
	const { user, isLoadingUser, refetchUser } = useAuth()
	const navigate = useNavigate()

	const { data: preview, isLoading, isError } = useInvitePreview(token)
	const acceptInvite = useAcceptInvite()

	const handleAccept = () => {
		acceptInvite.mutate(token, {
			onSuccess: (data) => {
				if (data.targetType === TargetType.LEASE) {
					toast.success("You've joined the lease!")
					navigate({
						to: '/leases/agreements/$leaseId',
						params: { leaseId: data.targetId },
					})
				} else {
					toast.success("You've joined the organization!")
					navigate({ to: '/' })
				}
			},
		})
	}

	const isPageLoading = isLoading || isLoadingUser

	return (
		<div className="flex flex-1 flex-col px-4 py-8 sm:px-6 lg:px-8">
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
							onRegistered={refetchUser}
						/>
					)}
				</DelayedLoadingFallback>
			</div>
		</div>
	)
}

interface InvitePageContentProps {
	preview: InvitePreviewResponse
	user: User | null
	onAccept: () => void
	isAccepting: boolean
	onRegistered: () => Promise<unknown>
}

function InvitePageContent({
	preview,
	user,
	onAccept,
	isAccepting,
	onRegistered,
}: InvitePageContentProps) {
	const { maskedEmail, expiresAt, invitedByName, status, targetType, preview: snapshot } =
		preview

	const isPending = status === InviteStatus.PENDING
	const isLease = targetType === TargetType.LEASE
	const leaseSnapshot = isLease ? (snapshot as LeaseInvitePreview) : null
	const membershipSnapshot = !isLease ? (snapshot as MembershipInvitePreview) : null

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
								<span>
									{[
										leaseSnapshot.property.addressLine1,
										leaseSnapshot.property.addressLine2,
										`${leaseSnapshot.property.city}, ${leaseSnapshot.property.stateProvinceRegion} ${leaseSnapshot.property.postalCode}`,
									]
										.filter(Boolean)
										.join(', ')}
								</span>
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

			{/* Detail sections — only when invite is pending */}
			{isPending && isLease && leaseSnapshot && (
				<div className="flex flex-col gap-4">
					{/* Unit */}
					<div className="rounded-lg border bg-card px-5 py-4">
						<div className="grid gap-4 sm:grid-cols-2">
							<DetailField label="Unit">
								{leaseSnapshot.unit.unitNumber}
								{leaseSnapshot.unit.unitType ? ` · ${leaseSnapshot.unit.unitType}` : ''}
							</DetailField>
							<DetailField label="Sent to">{maskedEmail}</DetailField>
						</div>
					</div>

					{/* Lease terms */}
					<div className="rounded-lg border bg-card px-5 py-4">
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
					</div>
				</div>
			)}

			{isPending && !isLease && membershipSnapshot && (
				<div className="rounded-lg border bg-card px-5 py-4">
					<div className="grid gap-4 sm:grid-cols-2">
						<DetailField label="Organization">
							{membershipSnapshot.organizationName}
						</DetailField>
						<DetailField label="Sent to">{maskedEmail}</DetailField>
					</div>
				</div>
			)}

			{/* Action card — centered below details */}
			<div className="flex justify-center mt-8">
				<div className="w-full max-w-md">
					<InviteActionCard
						status={status}
						targetType={targetType}
						organizationName={membershipSnapshot?.organizationName}
						user={user}
						expiresAt={expiresAt}
						onAccept={onAccept}
						isAccepting={isAccepting}
						onRegistered={onRegistered}
					/>
				</div>
			</div>
		</div>
	)
}

interface InviteActionCardProps {
	status: InviteStatus
	targetType: TargetType
	organizationName?: string
	user: User | null
	expiresAt: string
	onAccept: () => void
	isAccepting: boolean
	onRegistered: () => Promise<unknown>
}

function InviteActionCard({
	status,
	targetType,
	organizationName,
	user,
	expiresAt,
	onAccept,
	isAccepting,
	onRegistered,
}: InviteActionCardProps) {
	const isLease = targetType === TargetType.LEASE

	if (!user) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="text-base">Create your account</CardTitle>
					<p className="text-sm text-muted-foreground">
						{isLease
							? 'Register to accept this invite and access your lease.'
							: `Register to accept this invite and join ${organizationName}.`}
					</p>
				</CardHeader>
				<CardContent>
					<RegisterForm onSuccess={onRegistered} />
				</CardContent>
			</Card>
		)
	}

	const canAccept = status === InviteStatus.PENDING
	const isRevoked = status === InviteStatus.REVOKED
	const isExpired = status === InviteStatus.EXPIRED
	const isAccepted = status === InviteStatus.ACCEPTED

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base">
					{canAccept
						? 'Accept your invite'
						: isRevoked
							? 'Invite revoked'
							: isExpired
								? 'Invite expired'
								: 'Invite accepted'}
				</CardTitle>
				<p
					className="text-sm text-muted-foreground"
					{...(canAccept
						? {}
						: { role: 'status' as const, 'aria-live': 'polite' as const })}
				>
					{canAccept ? (
						<>
							{isLease
								? 'Accept the invite to join this lease as a tenant. You will be able to discuss and review the lease with property management.'
								: `Accept the invite to join ${organizationName} as a member.`}
							<br />
							<br />
							This invite expires {formatDateTime(expiresAt)}.
						</>
					) : (
						<>
							{isRevoked &&
								'This invite is no longer valid and cannot be accepted.'}
							{isExpired &&
								`This invite expired on ${formatDateTime(expiresAt)}.`}
							{isAccepted &&
								(isLease
									? "You've already accepted this invite and have access to the lease."
									: "You've already accepted this invite and have access to the organization.")}
						</>
					)}
				</p>
			</CardHeader>
			<CardContent className="flex flex-col items-center gap-3">
				{canAccept && (
					<>
						<Button
							className="w-full"
							onClick={onAccept}
							disabled={isAccepting}
							aria-busy={isAccepting}
						>
							{isAccepting ? 'Joining...' : 'Accept Invite'}
						</Button>
						{isLease && (
							<p className="text-xs text-muted-foreground text-center">
								* Accepting this invite is not the same as signing the lease.
							</p>
						)}
					</>
				)}
			</CardContent>
		</Card>
	)
}

function InvitePageSkeleton() {
	return (
		<div className="flex flex-col gap-6">
			{/* Header skeleton */}
			<div className="flex flex-col gap-2">
				<Skeleton className="h-3.5 w-36" />
				<Skeleton className="h-8 w-80" />
				<Skeleton className="h-3.5 w-56" />
			</div>

			{/* Detail skeletons */}
			<div className="flex flex-col gap-4">
				<div className="rounded-lg border bg-card px-5 py-4">
					<div className="grid gap-4 sm:grid-cols-2">
						{Array.from({ length: 2 }).map((_, i) => (
							<div key={i} className="space-y-2">
								<Skeleton className="h-3 w-16" />
								<Skeleton className="h-5 w-28" />
							</div>
						))}
					</div>
				</div>
				<div className="rounded-lg border bg-card px-5 py-4">
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

			{/* Action card skeleton — centered */}
			<div className="flex justify-center">
				<div className="w-full max-w-md rounded-lg border bg-card px-5 py-4 flex flex-col gap-3">
					<Skeleton className="h-5 w-36" />
					<Skeleton className="h-3.5 w-full" />
					<Skeleton className="h-3.5 w-3/4" />
					<Skeleton className="h-9 w-full mt-2" />
				</div>
			</div>
		</div>
	)
}
