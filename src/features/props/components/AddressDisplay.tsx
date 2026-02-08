import { cn } from '@abumble/design-system/utils'
import type { Address } from '@/features/props/props'
import { formatAddress } from '@/features/props/props'

export interface AddressDisplayProps {
	address: Address | null
	className?: string
}

/** Renders an address in a semantic <address> element (single line, comma-separated). */
export function AddressDisplay({ address, className }: AddressDisplayProps) {
	return (
		<address className={cn('not-italic', className)}>
			{formatAddress(address)}
		</address>
	)
}
