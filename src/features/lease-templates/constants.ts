/**
 * Shared constants for lease template forms and markdown editor.
 */

/**
 * System parameters that are automatically filled when creating a lease.
 * These are read-only and cannot be modified by users.
 */
export const SYSTEM_PARAMETERS = [
	{ key: 'property_name', description: "Property's legal name" },
	{ key: 'unit_number', description: 'Unit number' },
	{ key: 'start_date', description: 'Lease start date' },
	{ key: 'end_date', description: 'Lease end date' },
	{ key: 'rent_amount', description: 'Monthly rent amount' },
	{ key: 'rent_due_day', description: 'Day of month rent is due' },
	{ key: 'security_deposit', description: 'Security deposit amount' },
] as const

/**
 * Lease context parameters that are derived from lease/tenant data.
 * These are not in SYSTEM_PARAMETERS but are still built-in.
 */
export const LEASE_CONTEXT_PARAMETERS = [
	{ key: 'tenant_name', description: 'Tenant full name' },
	{ key: 'landlord_name', description: 'Landlord name' },
] as const

/**
 * All built-in parameters (system + context).
 * Used for markdown editor placeholder insertion.
 */
export const ALL_BUILTIN_PARAMETERS = [
	...SYSTEM_PARAMETERS,
	...LEASE_CONTEXT_PARAMETERS,
] as const

/**
 * Set of system parameter keys for fast lookup.
 */
export const SYSTEM_KEYS = new Set<string>(SYSTEM_PARAMETERS.map((sp) => sp.key))

/**
 * Preview values used in markdown editor to show sample data.
 * Bold markdown formatting is applied for visual distinction.
 */
export const PREVIEW_VALUES: Record<string, string> = {
	property_name: '**123 Main Street**',
	unit_number: '**Unit 4B**',
	start_date: '**January 1, 2026**',
	end_date: '**December 31, 2026**',
	rent_amount: '**$1,500**',
	rent_due_day: '**1st**',
	security_deposit: '**$1,500**',
	tenant_name: '**John Smith**',
	landlord_name: '**Jane Doe**',
}
