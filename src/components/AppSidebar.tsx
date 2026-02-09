import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
	SidebarTrigger,
	useSidebar,
} from '@abumble/design-system/components/Sidebar'
import { Link } from '@tanstack/react-router'
import {
	FileCheck,
	FileSignature,
	FileText,
	Home,
	LayoutGrid,
	MessageSquare,
	Package,
} from 'lucide-react'
import { useCallback } from 'react'
import { CollapsibleSidebarSection } from './CollapsibleSidebarSection'
import type { LinkComponentProps } from '@tanstack/react-router'
import type { LucideIcon } from 'lucide-react'

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

const navItemsAfterProps: Array<NavItem> = [
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
								<CollapsibleSidebarSection
									title="Properties"
									icon={Package}
									items={[
										{ to: '/props', label: 'Props', icon: Package },
										{ to: '/units', label: 'Units', icon: LayoutGrid },
									]}
									onItemClick={closeMobileSidebar}
								/>
								<CollapsibleSidebarSection
									title="Leases"
									icon={FileText}
									items={[
										{
											to: '/leases/templates',
											label: 'Templates',
											icon: FileSignature,
										},
										{
											to: '/leases/signed',
											label: 'Signed',
											icon: FileCheck,
										},
									]}
									onItemClick={closeMobileSidebar}
								/>
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
