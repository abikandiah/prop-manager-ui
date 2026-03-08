import {
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
} from '@abumble/design-system/components/Sidebar'
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from '@abumble/design-system/components/Collapsible'
import { Link } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/** Badge configuration for notifications/counts */
export type BadgeConfig =
	| number // Show count (e.g., 5)
	| 'dot' // Show indicator dot
	| React.ReactNode // Custom content

export interface SidebarItem {
	to: string
	label: string
	icon: LucideIcon
	/** Optional badge for this item */
	badge?: BadgeConfig
}

export interface CollapsibleSidebarSectionProps {
	/** Section title (e.g., "Properties", "Leases") */
	title: string
	/** Icon component for the section header */
	icon: LucideIcon
	/** Child navigation items */
	items: Array<SidebarItem>
	/** Whether section is open by default */
	defaultOpen?: boolean
	/** Callback when mobile sidebar should close */
	onItemClick?: () => void
	/** Optional badge for the section header */
	badge?: BadgeConfig
}

/** Simple inline badge component */
function Badge({
	children,
	variant = 'default',
}: {
	children: React.ReactNode
	variant?: 'default' | 'dot'
}) {
	if (variant === 'dot') {
		return <span className="size-2 rounded-full bg-primary animate-pulse" />
	}

	return (
		<span className="flex items-center justify-center min-w-5 h-5 px-1.5 text-xs font-semibold rounded-full bg-primary text-primary-foreground">
			{children}
		</span>
	)
}

/** Renders a badge based on config */
function renderBadge(badge: BadgeConfig | undefined) {
	if (!badge) return null

	if (badge === 'dot') {
		return <Badge variant="dot">{null}</Badge>
	}

	if (typeof badge === 'number') {
		// Only show if > 0
		return badge > 0 ? <Badge>{badge}</Badge> : null
	}

	// Custom React node
	return <>{badge}</>
}

/**
 * A unified sidebar navigation link component that handles both top-level
 * and sub-level (nested) navigation items with consistent active states and badges.
 */
export function SidebarNavLink({
	item,
	isSub = false,
	onClick,
}: {
	item: SidebarItem
	isSub?: boolean
	onClick?: () => void
}) {
	const { to, label, icon: Icon, badge } = item
	const ItemComponent = isSub ? SidebarMenuSubItem : SidebarMenuItem
	const ButtonComponent = isSub ? SidebarMenuSubButton : SidebarMenuButton

	return (
		<ItemComponent>
			<Link to={to} onClick={onClick}>
				{({ isActive }) => (
					<ButtonComponent asChild isActive={isActive}>
						<span className="flex items-center gap-2 w-full">
							<Icon className="size-4 shrink-0" />
							<span className="flex-1 text-left">{label}</span>
							{renderBadge(badge)}
						</span>
					</ButtonComponent>
				)}
			</Link>
		</ItemComponent>
	)
}

export function CollapsibleSidebarSection({
	title,
	icon: Icon,
	items,
	defaultOpen = true,
	onItemClick,
	badge,
}: CollapsibleSidebarSectionProps) {
	return (
		<Collapsible defaultOpen={defaultOpen} className="group/collapsible">
			<SidebarMenuItem>
				<CollapsibleTrigger asChild>
					<SidebarMenuButton>
						<span className="flex items-center gap-2 flex-1">
							<Icon className="size-4 shrink-0" />
							<span>{title}</span>
						</span>
						<span className="flex items-center gap-2">
							{renderBadge(badge)}
							<ChevronRight className="size-4 shrink-0 transition-transform group-data-[state=open]/collapsible:rotate-90" />
						</span>
					</SidebarMenuButton>
				</CollapsibleTrigger>
				<CollapsibleContent>
					<SidebarMenuSub>
						{items.map((item) => (
							<SidebarNavLink
								key={item.to}
								item={item}
								isSub
								onClick={onItemClick}
							/>
						))}
					</SidebarMenuSub>
				</CollapsibleContent>
			</SidebarMenuItem>
		</Collapsible>
	)
}
