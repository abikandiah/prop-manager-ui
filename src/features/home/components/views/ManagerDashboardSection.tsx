import { DashboardCard } from '@/features/home/components/views/DashboardCard'
import { FileCheck, FileSignature, LayoutGrid, Package } from 'lucide-react'

export function ManagerDashboardSection() {
	return (
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
		</div>
	)
}
