import { CenteredEmptyState } from '@/components/CenteredEmptyState'
import { TextLink } from '@/components/ui'
import { config } from '@/config'
import { useAuth } from '@/contexts/auth'
import { useAcceptInvite, useInvitePreview } from '@/features/invites/hooks'
import { InviteStatus } from '@/features/invites/types'
import { formatCurrency, formatDate } from '@/lib/format'
import { api, getDevToken } from '@/api/client'
import type { User } from '@/contexts/auth'
import { Button } from '@abumble/design-system/components/Button'
import {
	Card,
	CardContent,
	CardHeader,
} from '@abumble/design-system/components/Card'
import { Checkbox } from '@abumble/design-system/components/Checkbox'
import { DelayedLoadingFallback } from '@abumble/design-system/components/DelayedLoadingFallback'
import { Separator } from '@abumble/design-system/components/Separator'
import { Skeleton } from '@abumble/design-system/components/Skeleton'
import { DevAuthForm } from '@/components/DevAuthForm'
import { useMutation } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Home } from 'lucide-react'
import { useState } from 'react'
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
		<div className="flex flex-1 flex-col justify-center items-center px-4 py-8">
			<DelayedLoadingFallback
				isLoading={isPageLoading}
				delayMs={config.loadingFallbackDelayMs}
				fallback={<InviteCardSkeleton />}
			>
				{isError || !preview ? (
					<CenteredEmptyState
						title="Invite not found"
						description="This link may be invalid or expired."
						action={<TextLink to="/">Back to home</TextLink>}
					/>
				) : (
					<InviteCard
						preview={preview}
						user={user}
						onAccept={handleAccept}
						isAccepting={acceptInvite.isPending}
						onRegistered={refetchUser}
					/>
				)}
			</DelayedLoadingFallback>
		</div>
	)
}

interface InviteCardProps {
	preview: NonNullable<ReturnType<typeof useInvitePreview>['data']>
	user: User | null
	onAccept: () => void
	isAccepting: boolean
	onRegistered: () => Promise<unknown>
}

function InviteCard({ preview, user, onAccept, isAccepting, onRegistered }: InviteCardProps) {
	const { property, unit, lease, maskedEmail, expiresAt, invitedByName, status } = preview

	const propertyAddress = [
		property.addressLine1,
		property.addressLine2,
		`${property.city}, ${property.stateProvinceRegion} ${property.postalCode}`,
	]
		.filter(Boolean)
		.join(', ')

	return (
		<Card className="w-full max-w-lg">
			<CardHeader className="space-y-1">
				<p className="text-sm text-muted-foreground">
					Invited by <span className="font-medium text-foreground">{invitedByName}</span>
				</p>
				<h1 className="text-2xl font-semibold text-foreground">
					You've been invited to join as a tenant
				</h1>
			</CardHeader>

			<CardContent className="space-y-5">
				<div className="space-y-3">
					<div className="flex items-start gap-2">
						<Home className="size-4 mt-0.5 shrink-0 text-muted-foreground" />
						<div>
							<p className="font-medium text-foreground">{property.legalName}</p>
							<p className="text-sm text-muted-foreground">{propertyAddress}</p>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-3 text-sm">
						<div>
							<p className="text-muted-foreground">Unit</p>
							<p className="font-medium text-foreground">
								{unit.unitNumber}
								{unit.unitType ? ` · ${unit.unitType}` : ''}
							</p>
						</div>
						<div>
							<p className="text-muted-foreground">Rent</p>
							<p className="font-medium text-foreground">
								{formatCurrency(lease.rentAmount)} / month
							</p>
						</div>
						<div>
							<p className="text-muted-foreground">Lease start</p>
							<p className="font-medium text-foreground">{formatDate(lease.startDate)}</p>
						</div>
						<div>
							<p className="text-muted-foreground">Lease end</p>
							<p className="font-medium text-foreground">{formatDate(lease.endDate)}</p>
						</div>
					</div>

					<div className="flex items-center justify-between text-sm text-muted-foreground">
						<span>Sent to: <span className="font-medium">{maskedEmail}</span></span>
						<span>Expires: {formatDate(expiresAt)}</span>
					</div>
				</div>

				<Separator />

				<InviteAction
					status={status}
					user={user}
					onAccept={onAccept}
					isAccepting={isAccepting}
					onRegistered={onRegistered}
				/>
			</CardContent>
		</Card>
	)
}

interface InviteActionProps {
	status: InviteStatus
	user: User | null
	onAccept: () => void
	isAccepting: boolean
	onRegistered: () => Promise<unknown>
}

function InviteAction({ status, user, onAccept, isAccepting, onRegistered }: InviteActionProps) {
	if (!user) {
		return <InlineRegister onRegistered={onRegistered} />
	}

	if (status === InviteStatus.ACCEPTED) {
		return (
			<p className="text-sm text-muted-foreground text-center">
				You've already accepted this invite.
			</p>
		)
	}

	if (status === InviteStatus.EXPIRED) {
		return (
			<p className="text-sm text-amber-600 dark:text-amber-400 text-center">
				This invite has expired.
			</p>
		)
	}

	if (status === InviteStatus.REVOKED) {
		return (
			<p className="text-sm text-destructive text-center">
				This invite has been revoked.
			</p>
		)
	}

	return (
		<Button
			className="w-full"
			onClick={onAccept}
			disabled={isAccepting}
			aria-busy={isAccepting}
		>
			{isAccepting ? 'Joining...' : 'Accept Invite'}
		</Button>
	)
}

interface InlineRegisterProps {
	onRegistered: () => Promise<unknown>
}

function InlineRegister({ onRegistered }: InlineRegisterProps) {
	const [agreedToTermsAndPrivacy, setAgreedToTermsAndPrivacy] = useState(false)
	const [hasDevToken, setHasDevToken] = useState(() => !!getDevToken())

	const isDevNoToken = config.isDevelopment && !hasDevToken

	const registerMutation = useMutation({
		mutationFn: () => api.post<User>('/register', {}),
		onSuccess: () => {
			onRegistered()
			toast.success('Account created successfully.')
		},
	})

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		if (!agreedToTermsAndPrivacy) {
			toast.error('Please accept the Terms of Service and Privacy Policy to continue.')
			return
		}
		registerMutation.mutate()
	}

	if (isDevNoToken) {
		return (
			<DevAuthForm
				onSuccess={() => setHasDevToken(true)}
				wrappedInCard={false}
			/>
		)
	}

	return (
		<div className="space-y-4">
			<p className="text-sm text-muted-foreground">
				Create an account to accept this invite.
			</p>
			<form onSubmit={handleSubmit} className="space-y-4">
				<div className="flex items-start gap-3">
					<Checkbox
						id="invite-agreement"
						checked={agreedToTermsAndPrivacy}
						onCheckedChange={(checked) => setAgreedToTermsAndPrivacy(!!checked)}
					/>
					<label className="text-sm font-normal -mt-0.5 text-foreground" htmlFor="invite-agreement">
						I've read and agree to the{' '}
						<TextLink
							to="/public/terms"
							target="_blank"
							rel="noopener noreferrer"
							className="text-foreground underline underline-offset-2"
						>
							Terms of Service
						</TextLink>{' '}
						and{' '}
						<TextLink
							to="/public/privacy"
							target="_blank"
							rel="noopener noreferrer"
							className="text-foreground underline underline-offset-2"
						>
							Privacy Policy
						</TextLink>
						.
					</label>
				</div>

				<Button
					type="submit"
					className="w-full"
					disabled={registerMutation.isPending || !agreedToTermsAndPrivacy}
					aria-busy={registerMutation.isPending}
				>
					{registerMutation.isPending ? 'Creating account...' : 'Create account'}
				</Button>
			</form>
		</div>
	)
}

function InviteCardSkeleton() {
	return (
		<Card className="w-full max-w-lg">
			<CardHeader className="space-y-2">
				<Skeleton className="h-4 w-32" />
				<Skeleton className="h-7 w-3/4" />
			</CardHeader>
			<CardContent className="space-y-5">
				<div className="space-y-3">
					<div className="flex items-start gap-2">
						<Skeleton className="size-4 mt-0.5 shrink-0" />
						<div className="space-y-1.5 flex-1">
							<Skeleton className="h-4 w-40" />
							<Skeleton className="h-3 w-56" />
						</div>
					</div>
					<div className="grid grid-cols-2 gap-3">
						{Array.from({ length: 4 }).map((_, i) => (
							<div key={i} className="space-y-1">
								<Skeleton className="h-3 w-16" />
								<Skeleton className="h-4 w-24" />
							</div>
						))}
					</div>
					<Skeleton className="h-3 w-full" />
				</div>
				<Skeleton className="h-px w-full" />
				<Skeleton className="h-9 w-full" />
			</CardContent>
		</Card>
	)
}
