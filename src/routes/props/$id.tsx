import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Skeleton } from '@abumble/design-system/components/Skeleton'
import { Button } from '@abumble/design-system/components/Button'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@abumble/design-system/components/Popover'
import { MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { AddressDisplay } from '@/features/props/components'
import { usePropDetail, useDeleteProp } from '@/features/props/hooks'
import { formatAddress } from '@/features/props/props'
import type { Prop } from '@/features/props/props'
import { CenteredEmptyState } from '@/components/CenteredEmptyState'
import {
	BannerHeader,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	TextLink,
} from '@/components/ui'

export const Route = createFileRoute('/props/$id')({
	component: PropDetailPage,
})

function PropActions({ prop }: { prop: Prop }) {
	const [open, setOpen] = useState(false)
	const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
	const navigate = useNavigate()
	const deleteProp = useDeleteProp()

	const openDeleteConfirm = () => {
		setOpen(false)
		setDeleteConfirmOpen(true)
	}

	const handleDeleteConfirm = () => {
		deleteProp.mutate(prop.id, {
			onSuccess: () => {
				setDeleteConfirmOpen(false)
				toast.success('Property deleted')
				navigate({ to: '/props' })
			},
			onError: (err) => {
				toast.error(err?.message ?? 'Failed to delete property')
			},
		})
	}

	return (
		<>
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className="size-8 shrink-0"
						aria-label="Actions"
					>
						<MoreVertical className="size-4" />
					</Button>
				</PopoverTrigger>
				<PopoverContent align="end" className="w-40 p-0 mt-1">
					<ul className="flex flex-col gap-0.5 p-1.5">
						<li>
							<Button
								variant="ghost"
								size="sm"
								className="w-full justify-start gap-2"
								asChild
							>
								<Link
									to="/props/$id"
									params={{ id: prop.id }}
									onClick={() => setOpen(false)}
								>
									<Pencil className="size-4 shrink-0" />
									Edit
								</Link>
							</Button>
						</li>
						<li>
							<Button
								variant="ghost"
								size="sm"
								className="w-full justify-start gap-2 text-destructive hover:text-destructive"
								onClick={openDeleteConfirm}
								disabled={deleteProp.isPending}
							>
								<Trash2 className="size-4 shrink-0" />
								Delete
							</Button>
						</li>
					</ul>
				</PopoverContent>
			</Popover>

			<Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
				<DialogContent showCloseButton={true}>
					<DialogHeader>
						<DialogTitle>Delete property?</DialogTitle>
						<DialogDescription>
							{prop.legalName} will be removed. This can&apos;t be undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter showCloseButton={false}>
						<Button
							variant="outline"
							onClick={() => setDeleteConfirmOpen(false)}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={handleDeleteConfirm}
							disabled={deleteProp.isPending}
						>
							{deleteProp.isPending ? 'Deleting…' : 'Delete'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	)
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
			<div className="flex flex-col gap-6">
				<div className="flex items-center gap-2">
					<Skeleton className="h-9 w-9 rounded" />
					<Skeleton className="h-8 w-48" />
				</div>
				<div className="space-y-3">
					{[1, 2, 3, 4, 5].map((i) => (
						<div key={i} className="flex gap-6">
							<Skeleton className="h-5 w-24 shrink-0" />
							<Skeleton className="h-5 flex-1" />
						</div>
					))}
				</div>
			</div>
		)
	}

	if (isError || !prop) {
		const message = isError
			? (error?.message ?? 'Failed to load property')
			: 'The property you were looking for was not found.'
		return (
			<CenteredEmptyState
				title="Property not found"
				description={message}
				action={<TextLink to="/props">Back to properties</TextLink>}
			/>
		)
	}

	return (
		<div className="flex flex-col gap-6">
			<BannerHeader
				title={prop.legalName}
				description={
					<>
						{prop.propertyType.replace(/_/g, ' ')}
						{prop.address && ` · ${formatAddress(prop.address)}`}
					</>
				}
				breadcrumbItems={[
					{ label: 'Properties', to: '/props' },
					{ label: prop.legalName },
				]}
				actions={<PropActions prop={prop} />}
			/>

			<table className="w-full border-0 text-left">
						<tbody>
							<tr>
								<th
									scope="row"
									className="py-1.5 pr-4 text-sm font-medium text-muted-foreground w-[10rem]"
								>
									Legal name
								</th>
								<td className="py-1.5 text-foreground">{prop.legalName}</td>
							</tr>
							<tr>
								<th
									scope="row"
									className="py-1.5 pr-4 text-sm font-medium text-muted-foreground"
								>
									Property type
								</th>
								<td className="py-1.5 text-foreground">
									{prop.propertyType.replace(/_/g, ' ')}
								</td>
							</tr>
							{prop.parcelNumber && (
								<tr>
									<th
										scope="row"
										className="py-1.5 pr-4 text-sm font-medium text-muted-foreground"
									>
										Parcel number
									</th>
									<td className="py-1.5 text-foreground">{prop.parcelNumber}</td>
								</tr>
							)}
							{prop.totalArea != null && (
								<tr>
									<th
										scope="row"
										className="py-1.5 pr-4 text-sm font-medium text-muted-foreground"
									>
										Total area
									</th>
									<td className="py-1.5 text-foreground">
										{prop.totalArea} sq ft
									</td>
								</tr>
							)}
							{prop.yearBuilt != null && (
								<tr>
									<th
										scope="row"
										className="py-1.5 pr-4 text-sm font-medium text-muted-foreground"
									>
										Year built
									</th>
									<td className="py-1.5 text-foreground">{prop.yearBuilt}</td>
								</tr>
							)}
							<tr>
								<th
									scope="row"
									className="py-1.5 pr-4 text-sm font-medium text-muted-foreground"
								>
									Status
								</th>
								<td className="py-1.5 text-foreground">
									{prop.isActive ? 'Active' : 'Inactive'}
								</td>
							</tr>
							{prop.address && (
								<tr>
									<th
										scope="row"
										className="py-1.5 pr-4 text-sm font-medium text-muted-foreground"
									>
										Address
									</th>
									<td className="py-1.5 text-foreground">
										<AddressDisplay address={prop.address} />
									</td>
								</tr>
							)}
						</tbody>
					</table>
		</div>
	)
}
