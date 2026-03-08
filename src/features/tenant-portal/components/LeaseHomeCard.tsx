import type { TenantUnitSummary } from '@/domain/tenant-portal'
import { formatEnumLabel } from '@/lib/format'
import { cn } from '@abumble/design-system/utils'
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '@abumble/design-system/components/Card'

function AmenityChip({ label }: { label: string }) {
	return (
		<span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium">
			{label}
		</span>
	)
}

export function LeaseHomeCard({ unit }: { unit: TenantUnitSummary }) {
	const headline = unit.unitType
		? `Unit ${unit.unitNumber} — ${formatEnumLabel(unit.unitType)}`
		: `Unit ${unit.unitNumber}`

	const amenities = [
		unit.balcony && 'Balcony',
		unit.laundryInUnit && 'Laundry in unit',
		unit.hardwoodFloors && 'Hardwood floors',
	].filter(Boolean) as string[]

	return (
		<Card>
			<CardHeader className="px-5 pb-3">
				<CardTitle className="text-base">{headline}</CardTitle>
			</CardHeader>
			<CardContent className="px-5 space-y-4">
				<div className="flex flex-wrap gap-4 text-sm">
					{unit.bedrooms != null && (
						<span>
							<span className="font-semibold">{unit.bedrooms}</span> bed
						</span>
					)}
					{unit.bathrooms != null && (
						<span>
							<span className="font-semibold">{unit.bathrooms}</span> bath
						</span>
					)}
					{unit.squareFootage != null && (
						<span>
							<span className="font-semibold">
								{unit.squareFootage.toLocaleString()}
							</span>{' '}
							sq ft
						</span>
					)}
				</div>
				{amenities.length > 0 && (
					<div className="flex flex-wrap gap-2">
						{amenities.map((a) => (
							<AmenityChip key={a} label={a} />
						))}
					</div>
				)}
			</CardContent>
		</Card>
	)
}
