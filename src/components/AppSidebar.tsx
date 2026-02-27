import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
	SidebarTrigger,
	useSidebar,
} from '@abumble/design-system/components/Sidebar'
import type { LinkComponentProps } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'
import type { LucideIcon } from 'lucide-react'
import {
	Building2,
	FileCheck,
	FileSignature,
	FileText,
	LayoutDashboard,
	LayoutGrid,
	Store,
	UserCheck,
	Users,
} from 'lucide-react'
import { useCallback } from 'react'
import { CollapsibleSidebarSection } from './CollapsibleSidebarSection'

type NavItem = {
	to: '/'
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
				collapsible="offcanvas"
				className="bg-sidebar border-r border-sidebar-border h-[calc(100vh-3.5rem)]"
			>
				<SidebarContent>
					<SidebarGroup>
						<SidebarGroupContent>
							<SidebarMenu>
								<SidebarNavLink
									item={{ to: '/', label: 'Dashboard', icon: LayoutDashboard }}
									onClick={closeMobileSidebar}
								/>
								<CollapsibleSidebarSection
									title="Portfolio"
									icon={Building2}
									items={[
										{ to: '/props', label: 'Properties', icon: Building2 },
										{ to: '/units', label: 'Units', icon: LayoutGrid },
									]}
									onItemClick={closeMobileSidebar}
								/>
								<CollapsibleSidebarSection
									title="People"
									icon={Users}
									items={[
										{ to: '/people/tenants', label: 'Tenants', icon: Users },
										{ to: '/people/owners', label: 'Owners', icon: UserCheck },
										{ to: '/people/vendors', label: 'Vendors', icon: Store },
									]}
									onItemClick={closeMobileSidebar}
								/>
								<CollapsibleSidebarSection
									title="Leasing"
									icon={FileText}
									items={[
										{
											to: '/leases/templates',
											label: 'Templates',
											icon: FileSignature,
										},
										{
											to: '/leases/agreements',
											label: 'Agreements',
											icon: FileCheck,
										},
										// {
										// 	to: '/leases/applications',
										// 	label: 'Applications',
										// 	icon: ClipboardList,
										// },
									]}
									onItemClick={closeMobileSidebar}
								/>
								<CollapsibleSidebarSection
									title="Team"
									icon={UserCheck}
									items={[
										{
											to: '/organization/members',
											label: 'Members',
											icon: Users,
										},
										{
											to: '/organization/roles',
											label: 'Roles',
											icon: FileSignature,
										},
									]}
									onItemClick={closeMobileSidebar}
								/>
								{/* <CollapsibleSidebarSection
									title="Maintenance"
									icon={Wrench}
									items={[
										{
											to: '/maintenance/requests',
											label: 'Requests',
											icon: ClipboardList,
										},
										{
											to: '/maintenance/work-orders',
											label: 'Work Orders',
											icon: Hammer,
										},
									]}
									onItemClick={closeMobileSidebar}
								/> */}
								{/* <CollapsibleSidebarSection
									title="Finance"
									icon={BarChart3}
									items={[
										{
											to: '/finance/transactions',
											label: 'Transactions',
											icon: ArrowLeftRight,
										},
										{
											to: '/finance/invoices',
											label: 'Invoices',
											icon: Receipt,
										},
										{
											to: '/finance/reports',
											label: 'Reports',
											icon: BarChart3,
										},
									]}
									onItemClick={closeMobileSidebar}
								/> */}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				</SidebarContent>

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
