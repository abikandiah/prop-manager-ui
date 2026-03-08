import type { TenantPropertySummary } from '@/domain/tenant-portal'
import { formatAddress, formatEnumLabel } from '@/lib/format'
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '@abumble/design-system/components/Card'

export function LeasePropertyCard({
	property,
}: {
	property: TenantPropertySummary
}) {
	return (
		<Card>
			<CardHeader className="px-5 pb-3">
				<CardTitle className="text-base">Property</CardTitle>
			</CardHeader>
			<CardContent className="px-5 space-y-1 text-sm">
				<p className="font-medium text-foreground">{property.legalName}</p>
				{property.address && (
					<p className="text-muted-foreground">
						{formatAddress(property.address)}
					</p>
				)}
				<p className="text-muted-foreground">
					{formatEnumLabel(property.propertyType)}
				</p>
				{property.yearBuilt && (
					<p className="text-muted-foreground">Built {property.yearBuilt}</p>
				)}
				{(property.managementPhone || property.managementEmail) && (
					<div className="pt-2 border-t mt-2 space-y-1">
						<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
							Contact management
						</p>
						{property.managementPhone && (
							<a
								href={`tel:${property.managementPhone}`}
								className="flex items-center gap-1.5 text-primary hover:underline underline-offset-4"
							>
								{property.managementPhone}
							</a>
						)}
						{property.managementEmail && (
							<a
								href={`mailto:${property.managementEmail}`}
								className="flex items-center gap-1.5 text-primary hover:underline underline-offset-4 break-all"
							>
								{property.managementEmail}
							</a>
						)}
					</div>
				)}
			</CardContent>
		</Card>
	)
}
