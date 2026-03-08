import { DashboardCard } from '@/features/home/components/views/DashboardCard'
import { CreditCard, FileCheck, MessageSquare, Wrench } from 'lucide-react'

export function TenantDashboardSection() {
	return (
		<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			<DashboardCard
				to="/my-lease"
				icon={FileCheck}
				title="My Lease"
				description="View your current lease agreement, terms, and important dates."
			/>
			<DashboardCard
				to="/payments"
				icon={CreditCard}
				title="Payments"
				description="See your payment history and make payments on your lease."
			/>
			<DashboardCard
				to="/maintenance"
				icon={Wrench}
				title="Maintenance"
				description="Submit and track maintenance requests for your unit."
			/>
			<DashboardCard
				to="/messages"
				icon={MessageSquare}
				title="Messages"
				description="Read and manage your messages in one place."
			/>
		</div>
	)
}
