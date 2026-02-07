import { createFileRoute, Link } from '@tanstack/react-router'
import { toast } from 'sonner'
import { Skeleton } from '@abumble/design-system/components/Skeleton'
import { usePropDetail } from '@/features/props/hooks'
import type { Prop } from '@/features/props/props'
import { BannerHeader } from '@/components/ui'
import { useEffect } from 'react'
import { ChevronLeft } from 'lucide-react'

export const Route = createFileRoute('/props/$id')({
	component: PropDetailPage,
})

function formatAddress(p: Prop): string {
	const a = p.address
	if (!a) return '—'
	const parts = [
		a.addressLine1,
		a.addressLine2,
		[a.city, a.stateProvinceRegion].filter(Boolean).join(', '),
		a.postalCode,
		a.countryCode,
	].filter(Boolean)
	return parts.join(', ') || '—'
}

function PropDetailPage() {
	const { id } = Route.useParams()
	const { data: prop, isLoading, isError, error } = usePropDetail(id)

	useEffect(() => {
		if (isError) {
			toast.error(`Error loading property: ${error?.message ?? 'Unknown'}`)
		}
	}, [isError, error])

	if (isLoading) {
		return (
			<div className="flex flex-col gap-8">
				<div className="flex items-center gap-2">
					<Skeleton className="h-9 w-9 rounded" />
					<Skeleton className="h-8 w-48" />
				</div>
				<div className="space-y-4">
					<Skeleton className="h-8 w-64" />
					<Skeleton className="h-5 w-full max-w-md" />
					<Skeleton className="h-5 w-32" />
				</div>
			</div>
		)
	}

	if (isError || !prop) {
		return (
			<div className="flex flex-col gap-4">
				<Link
					to="/props"
					className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
				>
					<ChevronLeft className="size-4" />
					Back to Properties
				</Link>
				<p className="text-destructive">
					{isError
						? (error?.message ?? 'Failed to load property')
						: 'Property not found.'}
				</p>
			</div>
		)
	}

	return (
		<div className="flex flex-col gap-8">
			<div className="flex flex-col gap-2">
				<Link
					to="/props"
					className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
				>
					<ChevronLeft className="size-4" />
					Back to Properties
				</Link>
			</div>

			<BannerHeader
				title={prop.legalName}
				description={
					<>
						{prop.propertyType.replace(/_/g, ' ')}
						{prop.address && ` · ${formatAddress(prop)}`}
					</>
				}
			/>

			<div className="grid gap-6 sm:grid-cols-2">
				<dl className="space-y-3">
					<div>
						<dt className="text-sm font-medium text-muted-foreground">
							Legal name
						</dt>
						<dd className="mt-0.5 text-foreground">{prop.legalName}</dd>
					</div>
					<div>
						<dt className="text-sm font-medium text-muted-foreground">
							Property type
						</dt>
						<dd className="mt-0.5 text-foreground">
							{prop.propertyType.replace(/_/g, ' ')}
						</dd>
					</div>
					{prop.parcelNumber && (
						<div>
							<dt className="text-sm font-medium text-muted-foreground">
								Parcel number
							</dt>
							<dd className="mt-0.5 text-foreground">{prop.parcelNumber}</dd>
						</div>
					)}
					{prop.totalArea != null && (
						<div>
							<dt className="text-sm font-medium text-muted-foreground">
								Total area
							</dt>
							<dd className="mt-0.5 text-foreground">{prop.totalArea} sq ft</dd>
						</div>
					)}
					{prop.yearBuilt != null && (
						<div>
							<dt className="text-sm font-medium text-muted-foreground">
								Year built
							</dt>
							<dd className="mt-0.5 text-foreground">{prop.yearBuilt}</dd>
						</div>
					)}
					<div>
						<dt className="text-sm font-medium text-muted-foreground">
							Status
						</dt>
						<dd className="mt-0.5 text-foreground">
							{prop.isActive ? 'Active' : 'Inactive'}
						</dd>
					</div>
				</dl>
				{prop.address && (
					<dl className="space-y-3">
						<div>
							<dt className="text-sm font-medium text-muted-foreground">
								Address
							</dt>
							<dd className="mt-0.5 text-foreground whitespace-pre-line">
								{[
									prop.address.addressLine1,
									prop.address.addressLine2,
									[prop.address.city, prop.address.stateProvinceRegion]
										.filter(Boolean)
										.join(', '),
									prop.address.postalCode,
									prop.address.countryCode,
								]
									.filter(Boolean)
									.join('\n')}
							</dd>
						</div>
					</dl>
				)}
			</div>
		</div>
	)
}
