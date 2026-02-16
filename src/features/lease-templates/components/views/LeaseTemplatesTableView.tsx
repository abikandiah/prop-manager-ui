import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { Skeleton } from '@abumble/design-system/components/Skeleton'
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
import { config } from '@/config'
import { formatDate } from '@/lib/format'

export interface LeaseTemplatesTableViewProps {
	activeOnly?: boolean
}

export function LeaseTemplatesTableView({
	activeOnly = false,
}: LeaseTemplatesTableViewProps) {
	const navigate = useNavigate()
	const allTemplates = useLeaseTemplatesList()
	const activeTemplates = useLeaseTemplatesActive()

	const {
		data: templates,
		isLoading,
		isError,
		error,
	} = activeOnly ? activeTemplates : allTemplates

	const handleRowClick = (template: LeaseTemplate) => {
		navigate({
			to: '/leases/templates/$templateId',
			params: { templateId: template.id },
		})
	}

	useEffect(() => {
		if (isError) {
			toast.error(`Error loading templates: ${error.message || 'Unknown'}`)
		}
	}, [isError, error])

	const skeletonTable = (
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
					{Array.from({ length: 3 }).map((_, i) => (
						<TableRow key={i}>
							<TableCell>
								<Skeleton className="h-6 w-48" />
							</TableCell>
							<TableCell>
								<Skeleton className="h-6 w-16" />
							</TableCell>
							<TableCell>
								<Skeleton className="h-6 w-16" />
							</TableCell>
							<TableCell>
								<Skeleton className="h-6 w-24" />
							</TableCell>
							<TableCell>
								<Skeleton className="h-6 w-20" />
							</TableCell>
							<TableCell>
								<Skeleton className="h-6 w-24" />
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
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
											? `${template.defaultLateFeeType.replace(/_/g, ' ')} ${template.defaultLateFeeAmount ? `($${template.defaultLateFeeAmount})` : ''}`
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
