/** Single-line address string (comma-separated). Returns '—' when address is null/empty. */
export function formatAddress(
	address: {
		addressLine1: string
		addressLine2: string | null
		city: string
		stateProvinceRegion: string
		postalCode: string
		countryCode: string
	} | null,
): string {
	if (!address) return '—'
	const parts = [
		address.addressLine1,
		address.addressLine2,
		[address.city, address.stateProvinceRegion].filter(Boolean).join(', '),
		address.postalCode,
		address.countryCode,
	].filter(Boolean)
	return parts.join(', ') || '—'
}

export function formatCurrency(n: number | null): string {
	if (n == null) return '—'
	return new Intl.NumberFormat(undefined, {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(n)
}

export function formatDate(dateString: string | null): string {
	if (!dateString) return '—'
	try {
		const date = new Date(dateString)
		return new Intl.DateTimeFormat(undefined, {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		}).format(date)
	} catch {
		return '—'
	}
}
