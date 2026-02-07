import { useEffect } from 'react'
import { useMutationState } from '@tanstack/react-query'
import { cn } from '@abumble/design-system/utils'
import { toast } from 'sonner'
import { Button } from '@abumble/design-system/components/Button'
import { Skeleton } from '@abumble/design-system/components/Skeleton'
import { useCreateProp, useDeleteProp, usePropsList } from '@/features/props'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'

export function PropsTableView() {
	const { data: props, isLoading, isError, error } = usePropsList()
	const createProp = useCreateProp()
	const deleteProp = useDeleteProp()

	useEffect(() => {
		if (isError) {
			toast.error(`Error loading properties: ${error.message}`)
		}
	}, [isError, error])

	const pendingDeletes = useMutationState({
		filters: { mutationKey: ['deleteProp'], status: 'pending' },
		select: (m) => m.state.variables as string,
	})

	return (
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
												className={cn(isPendingSync && 'text-muted-foreground')}
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
	)
}
