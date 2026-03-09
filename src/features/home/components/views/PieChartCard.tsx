import { SectionCard } from '@/components/ui/SectionCard'
import { Skeleton } from '@abumble/design-system/components/Skeleton'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

interface PieChartCardProps {
	title: string
	data: Array<{ name: string; value: number }>
	colors: string[]
	isLoading?: boolean
	emptyMessage?: string
	formatLabel?: (name: string) => string
}

export function PieChartCard({
	title,
	data,
	colors,
	isLoading,
	emptyMessage = 'No data yet',
	formatLabel = (n) => n,
}: PieChartCardProps) {
	return (
		<SectionCard title={title}>
			{isLoading ? (
				<div className="flex justify-center">
					<Skeleton className="h-48 w-48 rounded-full" />
				</div>
			) : data.length === 0 ? (
				<p className="flex h-48 items-center justify-center text-sm text-muted-foreground">
					{emptyMessage}
				</p>
			) : (
				<>
					<ResponsiveContainer width="100%" height={180}>
						<PieChart>
							<Pie
								data={data}
								cx="50%"
								cy="50%"
								innerRadius={55}
								outerRadius={80}
								dataKey="value"
							>
								{data.map((_, i) => (
									<Cell key={i} fill={colors[i % colors.length]} />
								))}
							</Pie>
							<Tooltip
								formatter={(value, name) => [
									`${value} units`,
									formatLabel(String(name)),
								]}
							/>
						</PieChart>
					</ResponsiveContainer>
					<div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
						{data.map((entry, i) => (
							<span
								key={entry.name}
								className="flex items-center gap-1.5 text-xs text-muted-foreground"
							>
								<span
									className="inline-block h-2 w-2 rounded-full"
									style={{ background: colors[i % colors.length] }}
								/>
								{formatLabel(entry.name)}
							</span>
						))}
					</div>
				</>
			)}
		</SectionCard>
	)
}
