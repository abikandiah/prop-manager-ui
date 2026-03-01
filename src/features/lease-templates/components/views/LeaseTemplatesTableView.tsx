import { useNavigate } from '@tanstack/react-router'
import { cn } from '@abumble/design-system/utils'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@abumble/design-system/components/Table'
import { DelayedLoadingFallback } from '@abumble/design-system/components/DelayedLoadingFallback'
import type { LeaseTemplate } from '@/domain/lease-template'
import {
	useLeaseTemplatesActive,
	useLeaseTemplatesList,
} from '@/features/lease-templates/hooks'
import { TableSkeleton } from '@/components/ui'
import { config } from '@/config'
import { formatDate, formatEnumLabel } from '@/lib/format'
import { useQueryErrorToast } from '@/lib/hooks'

export interface LeaseTemplatesTableViewProps {
	activeOnly?: boolean
}

export function LeaseTemplatesTableView({
	activeOnly = false,
}: LeaseTemplatesTableViewProps) {
	const navigate = useNavigate()
	const all = useLeaseTemplatesList()
	const active = useLeaseTemplatesActive()

	const {
		data: templates,
		isLoading,
		isError,
		error,
	} = activeOnly ? active : all

	const handleRowClick = (template: LeaseTemplate) => {
		navigate({
			to: '/leases/templates/$templateId',
			params: { templateId: template.id },
		})
	}

	useQueryErrorToast(isError, error as Error, 'templates')

	const skeletonTable = (
		<TableSkeleton
			headers={[
				'Name',
				'Version',
				'Status',
				'Late fee',
				'Notice period',
				'Created',
			]}
			columnWidths={['w-48', 'w-16', 'w-16', 'w-24', 'w-20', 'w-24']}
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
							<TableHead>Version</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Late fee</TableHead>
							<TableHead>Notice period</TableHead>
							<TableHead>Created</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{!templates || templates.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={6}
									className="h-24 text-center text-muted-foreground"
								>
									No templates yet. Create one above.
								</TableCell>
							</TableRow>
						) : (
							templates.map((template) => (
								<TableRow
									key={template.id}
									className="cursor-pointer hover:bg-muted/50"
									onClick={() => handleRowClick(template)}
								>
									<TableCell className="font-medium">{template.name}</TableCell>
									<TableCell className="text-muted-foreground">
										{template.versionTag || '—'}
									</TableCell>
									<TableCell>
										<span
											className={cn(
												'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
												template.active
													? 'bg-primary/10 text-primary'
													: 'bg-muted text-muted-foreground',
											)}
										>
											{template.active ? 'Active' : 'Inactive'}
										</span>
									</TableCell>
									<TableCell className="text-muted-foreground">
										{template.defaultLateFeeType
											? `${formatEnumLabel(template.defaultLateFeeType)} ${template.defaultLateFeeAmount ? `($${template.defaultLateFeeAmount})` : ''}`
											: '—'}
									</TableCell>
									<TableCell className="text-muted-foreground">
										{template.defaultNoticePeriodDays != null
											? `${template.defaultNoticePeriodDays} days`
											: '—'}
									</TableCell>
									<TableCell className="text-muted-foreground">
										{formatDate(template.createdAt)}
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
