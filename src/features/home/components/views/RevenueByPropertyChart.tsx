import {
	Bar,
	BarChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts'
import { Skeleton } from '@abumble/design-system/components/Skeleton'
import { SectionCard } from '@/components/ui/SectionCard'
import { formatCurrency } from '@/lib/format'

interface RevenueByPropertyChartProps {
	data: Array<{ name: string; revenue: number }>
	isLoading?: boolean
}

export function RevenueByPropertyChart({
	data,
	isLoading,
}: RevenueByPropertyChartProps) {
	return (
		<SectionCard title="Revenue by Property" contentClassName="p-5">
			{isLoading ? (
				<div className="space-y-3">
					{Array.from({ length: 3 }).map((_, i) => (
						<Skeleton key={i} className="h-6 w-full" />
					))}
				</div>
			) : data.length === 0 ? (
				<p className="flex h-40 items-center justify-center text-sm text-muted-foreground">
					No active leases yet
				</p>
			) : (
				<ResponsiveContainer
					width="100%"
					height={Math.max(160, data.length * 44)}
				>
					<BarChart
						data={data}
						layout="vertical"
						aria-label="Projected monthly revenue by property"
					>
						<XAxis
							type="number"
							tickFormatter={(v) => formatCurrency(v)}
							tick={{ fontSize: 11 }}
						/>
						<YAxis
							type="category"
							dataKey="name"
							width={90}
							tick={{ fontSize: 11 }}
						/>
						<Tooltip
							formatter={(v) => [formatCurrency(Number(v)), 'Revenue']}
						/>
						<Bar
							dataKey="revenue"
							fill="var(--chart-5)"
							radius={[0, 4, 4, 0]}
						/>
					</BarChart>
				</ResponsiveContainer>
			)}
		</SectionCard>
	)
}
