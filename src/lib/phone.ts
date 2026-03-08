import {
	isValidPhoneNumber,
	parsePhoneNumberWithError,
} from 'libphonenumber-js'

/**
 * Validates a phone number using libphonenumber-js.
 * Returns true if valid, false otherwise.
 * If empty/blank, returns true (it's up to the schema to decide if it's required).
 */
export function validatePhoneNumber(value: string | null | undefined): boolean {
	if (!value || value.trim() === '') return true
	try {
		return isValidPhoneNumber(value)
	} catch {
		return false
	}
}

/**
 * Formats a phone number to international format (E.164) if valid.
 * Returns the original string if invalid or empty.
 */
export function formatPhoneNumber(value: string | null | undefined): string {
	if (!value || value.trim() === '') return ''
	try {
		const phoneNumber = parsePhoneNumberWithError(value)
		return phoneNumber.format('INTERNATIONAL')
	} catch {
		return value || ''
	}
}
