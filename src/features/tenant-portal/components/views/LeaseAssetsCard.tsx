import type { TenantAssetSummary } from '@/domain/tenant-portal'
import { formatDate, formatEnumLabel } from '@/lib/format'
import { SectionCard } from '@/components/ui'
import { Wrench } from 'lucide-react'

function AssetRow({ asset }: { asset: TenantAssetSummary }) {
	const subLine = asset.warrantyExpiry
		? `Warranty until ${formatDate(asset.warrantyExpiry)}`
		: asset.lastServiceDate
			? `Last serviced ${formatDate(asset.lastServiceDate)}`
			: null

	return (
		<div className="flex items-start gap-3 py-2.5 border-b last:border-0">
			<Wrench className="size-4 mt-0.5 shrink-0 text-muted-foreground" />
			<div className="min-w-0 flex-1">
				<p className="text-sm font-medium leading-tight">
					{formatEnumLabel(asset.category)}
					{asset.makeModel && (
						<span className="font-normal text-muted-foreground">
							{' '}
							— {asset.makeModel}
						</span>
					)}
				</p>
				{asset.serialNumber && (
					<p className="text-xs text-muted-foreground">
						S/N: {asset.serialNumber}
					</p>
				)}
				{subLine && <p className="text-xs text-muted-foreground">{subLine}</p>}
			</div>
		</div>
	)
}

export function LeaseAssetsCard({ assets }: { assets: TenantAssetSummary[] }) {
	return (
		<SectionCard title="Appliances & assets">
			{assets.length === 0 ? (
				<p className="text-sm text-muted-foreground py-2">
					No appliances on record for your unit.
				</p>
			) : (
				assets.map((asset) => <AssetRow key={asset.id} asset={asset} />)
			)}
		</SectionCard>
	)
}
