import { useMemo } from 'react'
import { usePropsList } from '@/features/props'
import { useUnitsList } from '@/features/units'
import { useLeasesList } from '@/features/leases'
import { useMyLease } from '@/features/tenant-portal'
import { LeaseStatus } from '@/domain/lease'
import { UnitStatus } from '@/domain/unit'
import type { Prop } from '@/domain/property'
import type { Unit } from '@/domain/unit'
import type { Lease } from '@/domain/lease'
import type { TenantLeaseView } from '@/domain/tenant-portal'

// TODO: At ~1000+ units, move aggregation to a backend /api/stats/dashboard endpoint
// to avoid over-fetching on the client. See plans/dashboard-analytics-redesign.md.

export interface ExpiringLease {
	id: string
	unitId: string
	propertyId: string
	unitNumber: string
	endDate: string
	daysRemaining: number
}

export interface DashboardStats {
	occupancyRate: number
	totalUnits: number
	monthlyRevenue: number
	leaseRenewals: number
	pendingActions: number
	portfolioHealth: Array<{ name: string; value: number }>
	revenueByProperty: Array<{ name: string; revenue: number }>
	unitMix: Array<{ name: string; value: number }>
	expiringLeases: ExpiringLease[]
}

export interface TenantDashboardStats {
	leaseView: TenantLeaseView
	progressPct: number
	daysRemaining: number
	nextRentDue: Date
}

/** Pure computation — exported for unit testing. */
export function computeDashboardStats(
	props: Prop[],
	units: Unit[],
	leases: Lease[],
): DashboardStats {
	const now = new Date()
	// DST-safe: compare midnight-to-midnight so day counts are never off by an hour
	const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate())
	const sixtyDaysMidnight = new Date(nowMidnight.getTime() + 60 * 86_400_000)

	const occupancyRate =
		units.length > 0
			? (units.filter((u) => u.status === UnitStatus.OCCUPIED).length /
					units.length) *
				100
			: 0

	const activeLeases = leases.filter((l) => l.status === LeaseStatus.ACTIVE)

	const monthlyRevenue = activeLeases.reduce((sum, l) => sum + l.rentAmount, 0)

	// Build a unit lookup for O(1) unit number resolution
	const unitById = new Map(units.map((u) => [u.id, u]))

	const expiringLeases: ExpiringLease[] = activeLeases
		.filter((l) => {
			const endDate = new Date(l.endDate)
			const endMidnight = new Date(
				endDate.getFullYear(),
				endDate.getMonth(),
				endDate.getDate(),
			)
			return endMidnight <= sixtyDaysMidnight
		})
		.sort((a, b) => a.endDate.localeCompare(b.endDate))
		.map((l) => {
			const endDate = new Date(l.endDate)
			const endMidnight = new Date(
				endDate.getFullYear(),
				endDate.getMonth(),
				endDate.getDate(),
			)
			const daysRemaining = Math.max(
				0,
				Math.round(
					(endMidnight.getTime() - nowMidnight.getTime()) / 86_400_000,
				),
			)
			return {
				id: l.id,
				unitId: l.unitId,
				propertyId: l.propertyId,
				unitNumber: unitById.get(l.unitId)?.unitNumber ?? '—',
				endDate: l.endDate,
				daysRemaining,
			}
		})

	const pendingActions = leases.filter(
		(l) => l.status === LeaseStatus.DRAFT || l.status === LeaseStatus.REVIEW,
	).length

	const portfolioHealth = Object.values(UnitStatus)
		.map((status) => ({
			name: status,
			value: units.filter((u) => u.status === status).length,
		}))
		.filter((d) => d.value > 0)

	// Group active lease revenue by property
	const revenueMap = new Map<string, number>()
	for (const lease of activeLeases) {
		revenueMap.set(
			lease.propertyId,
			(revenueMap.get(lease.propertyId) ?? 0) + lease.rentAmount,
		)
	}
	const revenueByProperty = props
		.map((p) => ({
			name: p.legalName.slice(0, 15),
			revenue: revenueMap.get(p.id) ?? 0,
		}))
		.filter((d) => d.revenue > 0)

	// Group units by type
	const mixMap = new Map<string, number>()
	for (const unit of units) {
		const key = unit.unitType ?? 'Unspecified'
		mixMap.set(key, (mixMap.get(key) ?? 0) + 1)
	}
	const unitMix = Array.from(mixMap.entries()).map(([name, value]) => ({
		name,
		value,
	}))

	return {
		occupancyRate,
		totalUnits: units.length,
		monthlyRevenue,
		leaseRenewals: expiringLeases.length,
		pendingActions,
		portfolioHealth,
		revenueByProperty,
		unitMix,
		expiringLeases,
	}
}

export function useDashboardStats() {
	const { data: props, isLoading: propsLoading } = usePropsList()
	const { data: units, isLoading: unitsLoading } = useUnitsList()
	const { data: leases, isLoading: leasesLoading } = useLeasesList()

	const isLoading = propsLoading || unitsLoading || leasesLoading

	const stats = useMemo(() => {
		if (!props || !units || !leases) return null
		return computeDashboardStats(props, units, leases)
	}, [props, units, leases])

	return { stats, isLoading }
}

function computeNextRentDue(rentDueDay: number): Date {
	const now = new Date()
	const startOfToday = new Date(
		now.getFullYear(),
		now.getMonth(),
		now.getDate(),
	)
	// Clamp to the last day of the current month to avoid overflow (e.g. Feb 31 → Mar 3)
	const lastDayThisMonth = new Date(
		now.getFullYear(),
		now.getMonth() + 1,
		0,
	).getDate()
	const candidate = new Date(
		now.getFullYear(),
		now.getMonth(),
		Math.min(rentDueDay, lastDayThisMonth),
	)
	if (candidate < startOfToday) {
		// Rent due day has passed — compute for next month, also clamped
		const lastDayNextMonth = new Date(
			now.getFullYear(),
			now.getMonth() + 2,
			0,
		).getDate()
		return new Date(
			now.getFullYear(),
			now.getMonth() + 1,
			Math.min(rentDueDay, lastDayNextMonth),
		)
	}
	return candidate
}

export function useTenantDashboardStats() {
	const { data: leaseView, isLoading, isError } = useMyLease()

	const stats = useMemo((): TenantDashboardStats | null => {
		if (!leaseView) return null
		const { lease } = leaseView
		const now = new Date()
		const startDate = new Date(lease.startDate)
		const endDate = new Date(lease.endDate)
		const totalMs = endDate.getTime() - startDate.getTime()
		const elapsedMs = now.getTime() - startDate.getTime()
		const progressPct = Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100))
		const daysRemaining = Math.max(
			0,
			Math.ceil((endDate.getTime() - now.getTime()) / 86_400_000),
		)
		const nextRentDue = computeNextRentDue(lease.rentDueDay)
		return { leaseView, progressPct, daysRemaining, nextRentDue }
	}, [leaseView])

	return { stats, isLoading, isError, hasLease: !!leaseView }
}
