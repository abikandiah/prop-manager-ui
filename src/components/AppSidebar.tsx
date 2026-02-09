import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
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

const navItemsAfterProps: NavItem[] = [
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
						<SidebarGroupContent>
							<SidebarMenu>
								<SidebarNavLink
									item={{ to: '/', label: 'Home', icon: Home }}
									onClick={closeMobileSidebar}
								/>
								<SidebarMenuItem>
									<Link to="/props" onClick={closeMobileSidebar}>
										{({ isActive }) => (
											<SidebarMenuButton asChild isActive={isActive}>
												<span className="flex items-center gap-2">
													<Package className="size-4 shrink-0" />
													<span>Props</span>
												</span>
											</SidebarMenuButton>
										)}
									</Link>
									<SidebarMenuSub>
										<SidebarMenuSubItem>
											<Link to="/units" onClick={closeMobileSidebar}>
												{({ isActive }) => (
													<SidebarMenuSubButton asChild isActive={isActive}>
														<span className="flex items-center gap-2">
															<LayoutGrid className="size-4 shrink-0" />
															<span>Units</span>
														</span>
													</SidebarMenuSubButton>
												)}
											</Link>
										</SidebarMenuSubItem>
									</SidebarMenuSub>
								</SidebarMenuItem>
								{navItemsAfterProps.map((item) => (
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
