import { describe, expect, it } from 'vitest'
import { formatPhoneNumber, validatePhoneNumber } from './phone'

describe('validatePhoneNumber', () => {
	it('returns true for empty strings', () => {
		expect(validatePhoneNumber('')).toBe(true)
		expect(validatePhoneNumber(null)).toBe(true)
		expect(validatePhoneNumber(undefined)).toBe(true)
	})

	it('returns true for valid international numbers', () => {
		expect(validatePhoneNumber('+14165550100')).toBe(true)
		expect(validatePhoneNumber('+44 20 7946 0958')).toBe(true)
	})

	it('returns false for invalid numbers', () => {
		expect(validatePhoneNumber('not-a-number')).toBe(false)
		expect(validatePhoneNumber('1234')).toBe(false)
	})
})

describe('formatPhoneNumber', () => {
	it('formats numbers to international format', () => {
		expect(formatPhoneNumber('+14165550100')).toBe('+1 416 555 0100')
	})

	it('returns original string if invalid', () => {
		expect(formatPhoneNumber('invalid')).toBe('invalid')
	})

	it('returns empty string if empty', () => {
		expect(formatPhoneNumber('')).toBe('')
	})
})
