import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { cn } from '@abumble/design-system/utils'
import { toast } from 'sonner'
import { Skeleton } from '@abumble/design-system/components/Skeleton'
import { useCreateProp, usePropsList } from '@/features/props'
import { formatAddress } from '@/lib/format'
import { DelayedLoadingFallback } from '@/components/ui'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'

export function PropsTableView() {
	const navigate = useNavigate()
	const { data: props, isLoading, isError, error } = usePropsList()
	const createProp = useCreateProp()

	useEffect(() => {
		if (isError) {
			toast.error(`Error loading properties: ${error.message || 'Unknown'}`)
		}
	}, [isError, error])

	return (
		<div className="rounded border bg-card overflow-hidden">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Type</TableHead>
						<TableHead>Legal name</TableHead>
						<TableHead>Address</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					<DelayedLoadingFallback
						isLoading={isLoading}
						fallback={Array.from({ length: 5 }).map((_, i) => (
							<TableRow key={i}>
								<TableCell>
									<Skeleton className="h-6 w-20" />
								</TableCell>
								<TableCell>
									<Skeleton className="h-6 w-32" />
								</TableCell>
								<TableCell>
									<Skeleton className="h-6 w-full max-w-[200px]" />
								</TableCell>
							</TableRow>
						))}
					>
						{!props || props.length === 0 ? (
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
									createProp.isPending &&
									createProp.variables.legalName === p.legalName

								return (
									<TableRow
										key={p.id}
										className="cursor-pointer hover:bg-muted/50"
										onClick={() =>
											navigate({ to: '/props/$id', params: { id: p.id } })
										}
										onKeyDown={(e) => {
											if (e.key === 'Enter' || e.key === ' ') {
												e.preventDefault()
												navigate({ to: '/props/$id', params: { id: p.id } })
											}
										}}
										tabIndex={0}
										role="button"
									>
										<TableCell className="text-muted-foreground">
											{p.propertyType.replace(/_/g, ' ')}
										</TableCell>
										<TableCell className="font-medium">
											<div className="flex flex-col">
												<span
													className={cn(
														isPendingSync && 'text-muted-foreground',
													)}
												>
													{p.legalName}
												</span>
												{isPendingSync && (
													<span className="text-xs text-muted-foreground">
														pending sync
													</span>
												)}
											</div>
										</TableCell>
										<TableCell className="max-w-[220px] truncate text-muted-foreground">
											{formatAddress(p.address)}
										</TableCell>
									</TableRow>
								)
							})
						)}
					</DelayedLoadingFallback>
				</TableBody>
			</Table>
		</div>
	)
}
