import {
	Card,
	CardContent,
	CardHeader,
} from '@abumble/design-system/components/Card'
import { Button } from '@abumble/design-system/components/Button'
import { cn } from '@abumble/design-system/utils'
import { createFileRoute } from '@tanstack/react-router'
import { OPTIMISTIC_PROP_ID } from '@/api/prop-mutations'
import { usePropsList, useCreateProp, useDeleteProp } from '@/api/props-queries'

export const Route = createFileRoute('/props/')({
	component: RouteComponent,
})

function RouteComponent() {
	const { data: props, isLoading, isError, error } = usePropsList()
	const createProp = useCreateProp()
	const deleteProp = useDeleteProp()

	const handleCreate = () => {
		createProp.mutate({
			name: `Prop ${Date.now()}`,
			description: 'Created from UI',
		})
	}

	if (isLoading)
		return <div className="p-text text-muted-foreground">Loading props…</div>
	if (isError)
		return (
			<div className="p-text text-destructive">
				Error: {String(error?.message)}
			</div>
		)

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-semibold text-foreground">Props</h1>
				<Button onClick={handleCreate} disabled={createProp.isPending}>
					{createProp.isPending ? 'Creating…' : 'Add prop'}
				</Button>
			</div>
			{!props?.length ? (
				<Card className="card">
					<CardContent className="pt-6">
						<p className="p-text text-muted-foreground">
							No props yet. Add one above.
						</p>
					</CardContent>
				</Card>
			) : (
				<ul className="space-y-2">
					{props.map((p, index) => (
						<li key={p.id === OPTIMISTIC_PROP_ID ? `opt-${index}` : p.id}>
							<Card className="card">
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<span
										className={cn(
											'font-medium',
											p.id === OPTIMISTIC_PROP_ID && 'text-muted-foreground',
										)}
									>
										{p.name}
										{p.id === OPTIMISTIC_PROP_ID && ' (pending sync)'}
									</span>
									<Button
										variant="outline"
										size="sm"
										onClick={() => deleteProp.mutate(p.id)}
										disabled={
											deleteProp.isPending || p.id === OPTIMISTIC_PROP_ID
										}
									>
										Delete
									</Button>
								</CardHeader>
								{p.description && (
									<CardContent className="pt-0">
										<p className="p-text text-muted-foreground text-sm">
											{p.description}
										</p>
									</CardContent>
								)}
							</Card>
						</li>
					))}
				</ul>
			)}
		</div>
	)
}
