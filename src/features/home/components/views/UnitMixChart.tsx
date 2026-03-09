import { formatEnumLabel } from '@/lib/format'
import { PieChartCard } from './PieChartCard'

const COLORS = [
	'var(--chart-5)',
	'var(--chart-6)',
	'var(--chart-7)',
	'var(--chart-8)',
	'var(--chart-1)',
	'var(--chart-2)',
	'var(--chart-3)',
	'var(--chart-4)',
]

interface UnitMixChartProps {
	data: Array<{ name: string; value: number }>
	isLoading?: boolean
}

export function UnitMixChart({ data, isLoading }: UnitMixChartProps) {
	return (
		<PieChartCard
			title="Unit Mix"
			data={data}
			colors={COLORS}
			isLoading={isLoading}
			formatLabel={formatEnumLabel}
		/>
	)
}
