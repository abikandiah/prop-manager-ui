import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbSeparator,
} from '@abumble/design-system/components/Breadcrumb'
import * as React from 'react'
import { Link } from '@tanstack/react-router'
import { BackLink } from './BackLink'
import { PageDescription, PageHeader } from './page-header'

export interface BreadcrumbItemType {
	label: string
	to?: string
}

export interface BannerBackLinkOptions {
	/** Target path. Defaults to ".." (parent route). */
	to?: string
	/** Link text, e.g. "Back to properties". */
	label: string
}

export interface BannerHeaderProps {
	title: React.ReactNode
	description: React.ReactNode
	/** Single back link (chevron + label) above title. Defaults to relative ".." when to is omitted. */
	backLink?: BannerBackLinkOptions
	/** Parent breadcrumb items (does not include current page). Shows as compact nav above title. */
	breadcrumbItems?: BreadcrumbItemType[]
	/** Optional actions (e.g. triple-dot menu) shown at the top-right of the banner. */
	actions?: React.ReactNode
}

export function BannerHeader({
	title,
	description,
	backLink,
	breadcrumbItems,
	actions,
}: BannerHeaderProps) {
	const hasBreadcrumbs = breadcrumbItems != null && breadcrumbItems.length > 0

	let linkItem = null
	if (backLink != null) {
		linkItem = (
			<div className="">
				<BackLink to={backLink.to} label={backLink.label} />
			</div>
		)
	} else if (hasBreadcrumbs) {
		linkItem = (
			<Breadcrumb className="">
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
		)
	}

	return (
		<div className="relative -mx-4 -mt-4 overflow-hidden md:-mx-6 md:-mt-6">
			<div className="image-background absolute inset-0 opacity-10" />
			<div className="relative flex items-start justify-between gap-4 px-4 py-8 md:px-6 md:pt-12">
				<div className="min-w-0 flex-1 space-y-1.5">
					{linkItem}
					<PageHeader>{title}</PageHeader>
					<PageDescription>{description}</PageDescription>
				</div>
				{actions != null ? (
					<div className="shrink-0 pt-0.5">{actions}</div>
				) : null}
			</div>
		</div>
	)
}
