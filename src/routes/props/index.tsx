import { useEffect, useState } from 'react'
import { Button } from '@abumble/design-system/components/Button'
import { Input } from '@abumble/design-system/components/Input'
import { Skeleton } from '@abumble/design-system/components/Skeleton'
import { createFileRoute } from '@tanstack/react-router'
import { useMutationState } from '@tanstack/react-query'
import { cn } from '@abumble/design-system/utils'
import { toast } from 'sonner'
import { useCreateProp, useDeleteProp, usePropsList } from '@/features/props'
import { PageDescription, PageHeader } from '@/components/ui'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export const Route = createFileRoute('/props/')({
	component: RouteComponent,
})

function RouteComponent() {
	const { data: props, isLoading, isError, error } = usePropsList()
	const createProp = useCreateProp()
	const deleteProp = useDeleteProp()

	const [isDialogOpen, setIsDialogOpen] = useState(false)
	const [name, setName] = useState('')
	const [description, setDescription] = useState('')

	// Track which items are currently being deleted
	const pendingDeletes = useMutationState({
		filters: { mutationKey: ['deleteProp'], status: 'pending' },
		select: (m) => m.state.variables as string,
	})

	const handleCreate = (e: React.FormEvent) => {
		e.preventDefault()
		if (!name.trim()) return

		createProp.mutate(
			{
				name: name.trim(),
				description: description.trim() || null,
			},
			{
				onSuccess: () => {
					setName('')
					setDescription('')
					setIsDialogOpen(false)
					toast.success('Property created successfully')
				},
				onError: (err) => {
					toast.error(`Failed to create property: ${err.message}`)
				},
			},
		)
	}

	useEffect(() => {
		if (isError) {
			toast.error(`Error loading properties: ${error.message}`)
		}
	}, [isError, error])

	return (
		<div className="flex flex-col gap-8">
			{/* Header Banner */}
			<div className="relative -mx-4 -mt-4 overflow-hidden border-b bg-card md:-mx-6 md:-mt-6">
				<div className="image-background absolute inset-0 opacity-10" />
				<div className="relative px-4 py-8 md:px-6 md:py-12">
					<div className="space-y-1.5">
						<PageHeader>Properties</PageHeader>
						<PageDescription>
							Manage and monitor your properties, units, and tenants from one
							central dashboard.
						</PageDescription>
					</div>
				</div>
			</div>

			<div>
				<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
					<DialogTrigger asChild>
						<Button size="lg">Add property</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Add new property</DialogTitle>
							<DialogDescription>
								Fill in the details for the new property you want to manage.
							</DialogDescription>
						</DialogHeader>
						<form onSubmit={handleCreate} className="space-y-4 py-4">
							<div className="space-y-2">
								<Label htmlFor="name">Name</Label>
								<Input
									id="name"
									value={name}
									onChange={(e) => setName(e.target.value)}
									placeholder="e.g. Sunny Apartments"
									required
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="description">Description</Label>
								<Textarea
									id="description"
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									placeholder="Optional property details..."
									rows={3}
								/>
							</div>
							<DialogFooter>
								<Button
									variant="outline"
									type="button"
									onClick={() => setIsDialogOpen(false)}
								>
									Cancel
								</Button>
								<Button type="submit" disabled={createProp.isPending}>
									{createProp.isPending ? 'Creating…' : 'Create Property'}
								</Button>
							</DialogFooter>
						</form>
					</DialogContent>
				</Dialog>
			</div>

			<div className="rounded-md border bg-card overflow-hidden">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Description</TableHead>
							<TableHead className="w-[100px] text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isLoading ? (
							Array.from({ length: 5 }).map((_, i) => (
								<TableRow key={i}>
									<TableCell>
										<Skeleton className="h-6 w-32" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-6 w-full max-w-[300px]" />
									</TableCell>
									<TableCell className="text-right">
										<Skeleton className="ml-auto h-8 w-16" />
									</TableCell>
								</TableRow>
							))
						) : !props || props.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={3}
									className="h-24 text-center text-muted-foreground"
								>
									No properties yet. Add one above.
								</TableCell>
							</TableRow>
						) : (
							props.map((p) => {
								const isPendingSync =
									createProp.isPending && createProp.variables.name === p.name
								const isDeleting = pendingDeletes.includes(p.id)

								return (
									<TableRow key={p.id}>
										<TableCell className="font-medium">
											<div className="flex flex-col">
												<span
													className={cn(
														isPendingSync && 'text-muted-foreground',
													)}
												>
													{p.name}
												</span>
												{isPendingSync && (
													<span className="text-xs text-muted-foreground">
														pending sync
													</span>
												)}
											</div>
										</TableCell>
										<TableCell className="text-muted-foreground">
											{p.description || '-'}
										</TableCell>
										<TableCell className="text-right">
											<Button
												variant="outline"
												size="sm"
												onClick={() =>
													deleteProp.mutate(p.id, {
														onSuccess: () => {
															toast.success('Property deleted successfully')
														},
														onError: (err) => {
															toast.error(
																`Failed to delete property: ${err.message}`,
															)
														},
													})
												}
												disabled={isDeleting || isPendingSync}
												className="h-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
											>
												{isDeleting ? 'Deleting…' : 'Delete'}
											</Button>
										</TableCell>
									</TableRow>
								)
							})
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	)
}
