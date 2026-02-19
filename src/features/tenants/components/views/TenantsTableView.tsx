import { useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@abumble/design-system/components/Table'
import { DelayedLoadingFallback } from '@abumble/design-system/components/DelayedLoadingFallback'
import { TableSkeleton } from '@/components/ui'
import { useTenantsList } from '@/features/tenants/hooks'
import { config } from '@/config'

export function TenantsTableView() {
	const navigate = useNavigate()
	const { data: tenants, isLoading, isError, error } = useTenantsList()

	const lastErrorRef = useRef<unknown>(null)
	if (isError && error !== lastErrorRef.current) {
		lastErrorRef.current = error
		toast.error(`Error loading tenants: ${error.message || 'Unknown'}`)
	}
	if (!isError) lastErrorRef.current = null

	const skeletonTable = (
		<TableSkeleton
			headers={['Name', 'Email', 'Phone', 'Pets']}
			columnWidths={['w-40', 'w-48', 'w-32', 'w-16']}
		/>
	)

	return (
		<DelayedLoadingFallback
			isLoading={isLoading}
			delayMs={config.loadingFallbackDelayMs}
			fallback={skeletonTable}
		>
			<div className="rounded border bg-card overflow-hidden">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Email</TableHead>
							<TableHead>Phone</TableHead>
							<TableHead>Pets</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{!tenants || tenants.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={4}
									className="h-24 text-center text-muted-foreground"
								>
									No tenants yet.
								</TableCell>
							</TableRow>
						) : (
							tenants.map((tenant) => (
								<TableRow
									key={tenant.id}
									className="cursor-pointer hover:bg-muted/50"
									onClick={() =>
										navigate({
											to: '/tenants/$tenantId',
											params: { tenantId: tenant.id },
										})
									}
								>
									<TableCell className="font-medium">{tenant.name}</TableCell>
									<TableCell className="text-muted-foreground">
										{tenant.email}
									</TableCell>
									<TableCell className="text-muted-foreground">
										{tenant.phoneNumber ?? '—'}
									</TableCell>
									<TableCell className="text-muted-foreground">
										{tenant.hasPets == null
											? '—'
											: tenant.hasPets
												? 'Yes'
												: 'No'}
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>
		</DelayedLoadingFallback>
	)
}
