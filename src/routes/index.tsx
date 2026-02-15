import { createFileRoute } from '@tanstack/react-router'
import {
	FileCheck,
	FileSignature,
	LayoutGrid,
	MessageSquare,
	Package,
} from 'lucide-react'
import { BannerHeader } from '@abumble/design-system/components/BannerHeader'
import { DashboardCard } from '@/components/DashboardCard'

export const Route = createFileRoute('/')({
	component: Home,
})

function Home() {
	return (
		<div className="flex flex-col gap-8">
			<BannerHeader
				title="Dashboard"
				description="Your home base. From here you can jump to your list of properties or your messages—everything in one place."
			/>

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				<DashboardCard
					to="/props"
					icon={Package}
					title="Properties"
					description="See and manage every property you own or look after."
				/>
				<DashboardCard
					to="/units"
					icon={LayoutGrid}
					title="Units"
					description="Manage every unit across all your properties in one place."
				/>
				<DashboardCard
					to="/leases/templates"
					icon={FileSignature}
					title="Lease Templates"
					description="Create and manage lease templates for your properties."
				/>
				<DashboardCard
					to="/leases/agreements"
					icon={FileCheck}
					title="Lease Agreements"
					description="Manage lease agreements that connect tenants to your properties and units."
				/>
				<DashboardCard
					to="/messages"
					icon={MessageSquare}
					title="Messages"
					description="Read and manage your messages in one place."
				/>
			</div>
		</div>
	)
}
