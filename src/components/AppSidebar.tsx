import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
	SidebarTrigger,
	useSidebar,
} from '@abumble/design-system/components/Sidebar'
import { Link, type LinkComponentProps } from '@tanstack/react-router'
import type { LucideIcon } from 'lucide-react'
import { Home, MessageSquare, Package, LayoutGrid } from 'lucide-react'
import { useCallback } from 'react'

type NavItem = {
	to: '/' | '/props' | '/units' | '/messages'
	label: string
	icon: LucideIcon
}

function SidebarNavLink({
	item,
	...props
}: { item: NavItem } & Omit<LinkComponentProps<'a'>, 'to' | 'children'>) {
	const { to, label, icon: Icon } = item
	return (
		<SidebarMenuItem>
			<Link to={to} {...props}>
				{({ isActive }) => (
					<SidebarMenuButton asChild isActive={isActive}>
						<span className="flex items-center gap-2">
							<Icon className="size-4 shrink-0" />
							<span>{label}</span>
						</span>
					</SidebarMenuButton>
				)}
			</Link>
		</SidebarMenuItem>
	)
}

const navItems: NavItem[] = [
	{ to: '/', label: 'Home', icon: Home },
	{ to: '/props', label: 'Props', icon: Package },
	{ to: '/units', label: 'Units', icon: LayoutGrid },
	{ to: '/messages', label: 'Messages', icon: MessageSquare },
] as const

export function AppSidebar() {
	const state = useSidebar()

	const closeMobileSidebar = useCallback(
		function () {
			if (state.isMobile) {
				state.setOpenMobile(false)
			}
		},
		[state],
	)

	return (
		<>
			<Sidebar
				side="left"
				variant="sidebar"
				collapsible="icon"
				className="bg-sidebar border-r border-sidebar-border h-[calc(100vh-3.5rem)]"
			>
				<SidebarContent>
					<SidebarGroup>
						<SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
							Navigation
						</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu>
								{navItems.map((item) => (
									<SidebarNavLink
										key={item.to}
										item={item}
										onClick={closeMobileSidebar}
									/>
								))}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				</SidebarContent>

				{!state.isMobile && (
					<SidebarFooter className="border-t border-sidebar-border mb-2">
						<SidebarTrigger className="ml-auto" />
					</SidebarFooter>
				)}

				<SidebarRail />
			</Sidebar>

			{state.isMobile && (
				<SidebarTrigger
					className="fixed bottom-4 left-4 z-50"
					variant="outline"
				/>
			)}
		</>
	)
}
