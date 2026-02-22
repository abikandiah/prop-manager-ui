import { CenteredEmptyState } from '@/components/CenteredEmptyState'
import { RegisterForm } from '@/components/RegisterForm'
import { DetailField, TextLink } from '@/components/ui'
import { config } from '@/config'
import { useAuth } from '@/contexts/auth'
import { useAcceptInvite, useInvitePreview } from '@/features/invites/hooks'
import { InviteStatus } from '@/features/invites/types'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/format'
import type { User } from '@/contexts/auth'
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
import { Home } from 'lucide-react'
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
				toast.success("You've joined the lease!")
				navigate({
					to: '/leases/agreements/$leaseId',
					params: { leaseId: data.targetId },
				})
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
	preview: NonNullable<ReturnType<typeof useInvitePreview>['data']>
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
	const {
		property,
		unit,
		lease,
		maskedEmail,
		expiresAt,
		invitedByName,
		status,
	} = preview

	const propertyAddress = [
		property.addressLine1,
		property.addressLine2,
		`${property.city}, ${property.stateProvinceRegion} ${property.postalCode}`,
	]
		.filter(Boolean)
		.join(', ')

	return (
		<div className="flex flex-col gap-6">
			{/* Page header */}
			<div className="flex flex-col gap-1">
				<p className="text-sm text-muted-foreground">
					Invited by{' '}
					<span className="font-medium text-foreground">{invitedByName}</span>
				</p>
				<h1 className="text-2xl font-semibold text-foreground">
					You've been invited to join as a tenant
				</h1>
				<div className="flex items-center gap-1.5 text-sm text-muted-foreground">
					<Home className="size-3.5 shrink-0" />
					<span>{property.legalName}</span>
					{propertyAddress && (
						<>
							<span>·</span>
							<span>{propertyAddress}</span>
						</>
					)}
				</div>
			</div>

			{/* Detail sections */}
			<div className="flex flex-col gap-4">
				{/* Unit */}
				<div className="rounded-lg border bg-card px-5 py-4">
					<div className="grid gap-4 sm:grid-cols-2">
						<DetailField label="Unit">
							{unit.unitNumber}
							{unit.unitType ? ` · ${unit.unitType}` : ''}
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
							{formatCurrency(lease.rentAmount)}
						</DetailField>
						<DetailField label="Lease Start">
							{formatDate(lease.startDate)}
						</DetailField>
						<DetailField label="Lease End">
							{formatDate(lease.endDate)}
						</DetailField>
					</div>
				</div>
			</div>

			{/* Action card — centered below details */}
			<div className="flex justify-center">
				<div className="w-full max-w-md">
					<InviteActionCard
						status={status}
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
	user: User | null
	expiresAt: string
	onAccept: () => void
	isAccepting: boolean
	onRegistered: () => Promise<unknown>
}

function InviteActionCard({
	status,
	user,
	expiresAt,
	onAccept,
	isAccepting,
	onRegistered,
}: InviteActionCardProps) {
	if (!user) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="text-base">Create your account</CardTitle>
					<p className="text-sm text-muted-foreground">
						Register to accept this invite and access your lease.
					</p>
				</CardHeader>
				<CardContent>
					<RegisterForm onSuccess={onRegistered} />
				</CardContent>
			</Card>
		)
	}

	if (status === InviteStatus.ACCEPTED) {
		return (
			<Card>
				<CardContent className="pt-6 text-center">
					<p className="text-sm text-muted-foreground">
						You've already accepted this invite.
					</p>
				</CardContent>
			</Card>
		)
	}

	if (status === InviteStatus.EXPIRED) {
		return (
			<Card>
				<CardContent className="pt-6 text-center">
					<p className="text-sm text-amber-600 dark:text-amber-400">
						This invite expired on {formatDateTime(expiresAt)}.
					</p>
				</CardContent>
			</Card>
		)
	}

	const isRevoked = status === InviteStatus.REVOKED

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base">Accept your invite</CardTitle>
				<p className="text-sm text-muted-foreground">
					By accepting, you'll be added as a tenant on this lease. This invite
					expires {formatDateTime(expiresAt)}.
				</p>
			</CardHeader>
			<CardContent className="flex flex-col items-center gap-3">
				<Button
					className="w-full"
					onClick={onAccept}
					disabled={isAccepting || isRevoked}
					aria-busy={isAccepting}
				>
					{isAccepting ? 'Joining...' : 'Accept Invite'}
				</Button>
				{isRevoked && (
					<p className="text-sm text-destructive text-center">
						This invite has been revoked.
					</p>
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
