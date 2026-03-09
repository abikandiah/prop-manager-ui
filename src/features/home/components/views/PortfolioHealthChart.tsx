import { formatEnumLabel } from '@/lib/format'
import { PieChartCard } from './PieChartCard'

// Explicit key-based mapping — survives enum reordering on the backend
const STATUS_COLORS: Record<string, string> = {
	OCCUPIED: 'var(--chart-1)',
	VACANT: 'var(--chart-2)',
	NOTICE_GIVEN: 'var(--chart-3)',
	UNDER_MAINTENANCE: 'var(--chart-4)',
}

const FALLBACK_COLOR = 'var(--chart-1)'

interface PortfolioHealthChartProps {
	data: Array<{ name: string; value: number }>
	isLoading?: boolean
}

export function PortfolioHealthChart({
	data,
	isLoading,
}: PortfolioHealthChartProps) {
	const colors = data.map((d) => STATUS_COLORS[d.name] ?? FALLBACK_COLOR)
	return (
		<PieChartCard
			title="Portfolio Health"
			data={data}
			colors={colors}
			isLoading={isLoading}
			formatLabel={formatEnumLabel}
		/>
	)
}
