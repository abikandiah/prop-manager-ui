import type { Address } from './address'
import type { LateFeeType, LeaseStatus } from './lease'
import type { LeaseTenantRole, LeaseTenantStatus } from './lease-tenant'
import type { PropertyType } from './property'
import type { UnitType } from './unit'

export interface TenantLeaseView {
	lease: TenantLeaseSummary
	property: TenantPropertySummary
	unit: TenantUnitSummary
	assets: TenantAssetSummary[]
	coTenants: TenantCoTenantSummary[]
	/** The calling tenant's own LeaseTenant ID — used to invoke the sign endpoint. */
	myLeaseTenantId: string
	/** The calling tenant's current signing status on this lease. */
	myLeaseTenantStatus: LeaseTenantStatus
}

export interface TenantLeaseSummary {
	id: string
	status: LeaseStatus
	startDate: string
	endDate: string
	rentAmount: number
	rentDueDay: number
	securityDepositHeld: number | null
	lateFeeType: LateFeeType | null
	lateFeeAmount: number | null
	noticePeriodDays: number | null
	noticeDeadlineDate: string | null
	leaseTemplateName: string | null
	leaseTemplateVersionTag: string | null
	executedContentMarkdown: string | null
}

export interface TenantPropertySummary {
	id: string
	legalName: string
	address: Address | null
	propertyType: PropertyType
	description: string | null
	yearBuilt: number | null
	managementPhone: string | null
	managementEmail: string | null
}

export interface TenantUnitSummary {
	id: string
	unitNumber: string
	unitType: UnitType | null
	bedrooms: number | null
	bathrooms: number | null
	squareFootage: number | null
	balcony: boolean | null
	laundryInUnit: boolean | null
	hardwoodFloors: boolean | null
}

export interface TenantAssetSummary {
	id: string
	category: AssetCategory
	makeModel: string | null
	serialNumber: string | null
	installDate: string | null
	warrantyExpiry: string | null
	lastServiceDate: string | null
}

export interface TenantCoTenantSummary {
	name: string
	role: LeaseTenantRole
	status: LeaseTenantStatus
}

export const AssetCategory = {
	APPLIANCE: 'APPLIANCE',
	HVAC: 'HVAC',
	PLUMBING: 'PLUMBING',
	ELECTRICAL: 'ELECTRICAL',
	STRUCTURAL: 'STRUCTURAL',
	OTHER: 'OTHER',
} as const

export type AssetCategory = (typeof AssetCategory)[keyof typeof AssetCategory]
