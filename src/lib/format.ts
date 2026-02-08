export function formatCurrency(n: number | null): string {
	if (n == null) return '—'
	return new Intl.NumberFormat(undefined, {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(n)
}
