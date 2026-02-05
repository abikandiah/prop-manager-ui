import { useState } from 'react'
import { Button } from '@abumble/design-system/components/Button'
import { Input } from '@abumble/design-system/components/Input'
import { createFileRoute } from '@tanstack/react-router'
import { useMutationState } from '@tanstack/react-query'
import { cn } from '@abumble/design-system/utils'
import { useCreateProp, useDeleteProp, usePropsList } from '@/features/props'
import { PageHeader } from '@/components/ui'
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
				},
			},
		)
	}

	if (isLoading)
		return <div className="p-text text-muted-foreground">Loading props…</div>
	if (isError)
		return (
			<div className="p-text text-destructive">
				Error: {String(error.message)}
			</div>
		)

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<PageHeader size="sm">Props</PageHeader>
				<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
					<DialogTrigger asChild>
						<Button>Add prop</Button>
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
						{!props || props.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={3}
									className="h-24 text-center text-muted-foreground"
								>
									No props yet. Add one above.
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
												onClick={() => deleteProp.mutate(p.id)}
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
