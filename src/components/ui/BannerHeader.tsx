import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbSeparator,
} from '@abumble/design-system/components/Breadcrumb'
import * as React from 'react'
import { Link } from '@tanstack/react-router'
import { PageDescription, PageHeader } from './page-header'

export interface BreadcrumbItemType {
	label: string
	to?: string
}

export interface BannerHeaderProps {
	title: React.ReactNode
	description: React.ReactNode
	/** Parent breadcrumb items (does not include current page). Shows as compact nav above title. */
	breadcrumbItems?: BreadcrumbItemType[]
	/** Optional actions (e.g. triple-dot menu) shown at the top-right of the banner. */
	actions?: React.ReactNode
}

export function BannerHeader({
	title,
	description,
	breadcrumbItems,
	actions,
}: BannerHeaderProps) {
	const hasBreadcrumbs = breadcrumbItems != null && breadcrumbItems.length > 0

	return (
		<div className="relative -mx-4 -mt-4 overflow-hidden border-b bg-card md:-mx-6 md:-mt-6">
			<div className="image-background absolute inset-0 opacity-10" />
			<div className="relative flex items-start justify-between gap-4 px-4 py-8 md:px-6 md:pt-12 md:pb-8">
				<div className="min-w-0 flex-1">
					{hasBreadcrumbs && (
						<Breadcrumb className="mb-2">
							<BreadcrumbList className="text-sm">
								{breadcrumbItems.map((item, i) => (
									<React.Fragment key={i}>
										{i > 0 && <BreadcrumbSeparator />}
										<BreadcrumbItem>
											{item.to != null ? (
												<BreadcrumbLink asChild>
													<Link
														to={item.to}
														className="text-muted-foreground hover:text-foreground"
													>
														{item.label}
													</Link>
												</BreadcrumbLink>
											) : (
												<span className="text-muted-foreground">{item.label}</span>
											)}
										</BreadcrumbItem>
									</React.Fragment>
								))}
							</BreadcrumbList>
						</Breadcrumb>
					)}
					<PageHeader>{title}</PageHeader>
					<div className="mt-1.5">
						<PageDescription>{description}</PageDescription>
					</div>
				</div>
				{actions != null ? (
					<div className="shrink-0 pt-0.5">{actions}</div>
				) : null}
			</div>
		</div>
	)
}
