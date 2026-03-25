import { ResourceType } from '@/domain/policy-assignment'
import { AppRole } from '@/domain/user'
import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Actions, useCan, type AccessEntry } from './permissions'

const ORG_ID = 'org-1'
const PROP_ID = 'prop-1'
const UNIT_ID = 'unit-1'

const mockAccess: AccessEntry[] = [
	{
		orgId: ORG_ID,
		scopeType: ResourceType.ORG,
		scopeId: ORG_ID,
		permissions: { p: Actions.READ | Actions.CREATE }, // PORTFOLIO read+create
	},
]

const mockAccessWithUpdate: AccessEntry[] = [
	{
		orgId: ORG_ID,
		scopeType: ResourceType.ORG,
		scopeId: ORG_ID,
		permissions: { p: Actions.READ | Actions.CREATE | Actions.UPDATE | Actions.DELETE },
	},
]

const mockAccessPropertyLevel: AccessEntry[] = [
	{
		orgId: ORG_ID,
		scopeType: ResourceType.PROPERTY,
		scopeId: PROP_ID,
		permissions: { p: Actions.READ }, // PROPERTY entry with READ only — blocks ORG fallback
	},
	{
		orgId: ORG_ID,
		scopeType: ResourceType.ORG,
		scopeId: ORG_ID,
		permissions: { p: Actions.READ | Actions.CREATE | Actions.UPDATE | Actions.DELETE },
	},
]

// Mock hooks so tests don't need full React context trees
vi.mock('@/features/auth', () => ({
	useAuth: vi.fn(),
}))
vi.mock('@/contexts/organization', () => ({
	useOrganization: vi.fn(),
}))

import { useOrganization } from '@/contexts/organization'
import { useAuth } from '@/features/auth'

const mockUseAuth = vi.mocked(useAuth)
const mockUseOrganization = vi.mocked(useOrganization)

beforeEach(() => {
	mockUseOrganization.mockReturnValue({
		activeOrgId: ORG_ID,
		activeOrg: null,
		organizations: [],
	})
})

describe('useCan', () => {
	it('returns true for ADMIN regardless of access list', () => {
		mockUseAuth.mockReturnValue({
			user: {
				id: '1',
				email: '',
				name: '',
				termsAccepted: false,
				phoneNumber: null,
				organizations: [],
				roles: [AppRole.ADMIN],
				access: [],
			},
			isLoadingUser: false,
			isUserDefined: true,
			logout: vi.fn(),
			refreshUser: vi.fn(),
		})
		const { result } = renderHook(() => useCan('READ', 'LEASES'))
		expect(result.current).toBe(true)
	})

	it('returns false when user is null', () => {
		mockUseAuth.mockReturnValue({
			user: undefined,
			isLoadingUser: true,
			isUserDefined: false,
			logout: vi.fn(),
			refreshUser: vi.fn(),
		})
		const { result } = renderHook(() => useCan('READ', 'PORTFOLIO'))
		expect(result.current).toBe(false)
	})

	it('resolves correctly against a known access list', () => {
		mockUseAuth.mockReturnValue({
			user: {
				id: '1',
				email: '',
				name: '',
				termsAccepted: false,
				phoneNumber: null,
				organizations: [],
				roles: [AppRole.MANAGER],
				access: mockAccess,
			},
			isLoadingUser: false,
			isUserDefined: true,
			logout: vi.fn(),
			refreshUser: vi.fn(),
		})
		const { result: canRead } = renderHook(() => useCan('READ', 'PORTFOLIO'))
		expect(canRead.current).toBe(true)

		const { result: canDelete } = renderHook(() =>
			useCan('DELETE', 'PORTFOLIO'),
		)
		expect(canDelete.current).toBe(false)
	})

	it('returns false for PROPERTY scope with no scopeId', () => {
		mockUseAuth.mockReturnValue({
			user: {
				id: '1',
				email: '',
				name: '',
				termsAccepted: false,
				phoneNumber: null,
				organizations: [],
				roles: [AppRole.MANAGER],
				access: mockAccess,
			},
			isLoadingUser: false,
			isUserDefined: true,
			logout: vi.fn(),
			refreshUser: vi.fn(),
		})
		const { result } = renderHook(() =>
			useCan('UPDATE', 'PORTFOLIO', ResourceType.PROPERTY),
		)
		expect(result.current).toBe(false)
	})

	it('returns false when no scope in the chain has an entry granting the action', () => {
		mockUseAuth.mockReturnValue({
			user: {
				id: '1',
				email: '',
				name: '',
				termsAccepted: false,
				phoneNumber: null,
				organizations: [],
				roles: [AppRole.MANAGER],
				access: mockAccess, // ORG entry has READ+CREATE only
			},
			isLoadingUser: false,
			isUserDefined: true,
			logout: vi.fn(),
			refreshUser: vi.fn(),
		})
		// No PROPERTY entry — falls back to ORG, which has no UPDATE
		const { result } = renderHook(() =>
			useCan('UPDATE', 'PORTFOLIO', ResourceType.PROPERTY, PROP_ID),
		)
		expect(result.current).toBe(false)
	})

	it('resolves hierarchy: ORG entry grants PROPERTY-scoped check', () => {
		mockUseAuth.mockReturnValue({
			user: {
				id: '1',
				email: '',
				name: '',
				termsAccepted: false,
				phoneNumber: null,
				organizations: [],
				roles: [AppRole.MANAGER],
				access: mockAccessWithUpdate,
			},
			isLoadingUser: false,
			isUserDefined: true,
			logout: vi.fn(),
			refreshUser: vi.fn(),
		})
		// No PROPERTY entry — falls back to ORG which has UPDATE
		const { result } = renderHook(() =>
			useCan('UPDATE', 'PORTFOLIO', ResourceType.PROPERTY, PROP_ID),
		)
		expect(result.current).toBe(true)
	})

	it('resolves hierarchy: ORG entry grants UNIT-scoped check', () => {
		mockUseAuth.mockReturnValue({
			user: {
				id: '1',
				email: '',
				name: '',
				termsAccepted: false,
				phoneNumber: null,
				organizations: [],
				roles: [AppRole.MANAGER],
				access: mockAccessWithUpdate,
			},
			isLoadingUser: false,
			isUserDefined: true,
			logout: vi.fn(),
			refreshUser: vi.fn(),
		})
		// No UNIT or PROPERTY entry — falls back to ORG which has UPDATE
		const { result } = renderHook(() =>
			useCan('UPDATE', 'PORTFOLIO', ResourceType.UNIT, UNIT_ID, PROP_ID),
		)
		expect(result.current).toBe(true)
	})

	it('first-match-wins: PROPERTY entry with READ-only blocks ORG UPDATE grant', () => {
		mockUseAuth.mockReturnValue({
			user: {
				id: '1',
				email: '',
				name: '',
				termsAccepted: false,
				phoneNumber: null,
				organizations: [],
				roles: [AppRole.MANAGER],
				access: mockAccessPropertyLevel, // PROPERTY=READ, ORG=full
			},
			isLoadingUser: false,
			isUserDefined: true,
			logout: vi.fn(),
			refreshUser: vi.fn(),
		})
		// PROPERTY entry found first — has READ only, not UPDATE → denied (no ORG fallback)
		const { result } = renderHook(() =>
			useCan('UPDATE', 'PORTFOLIO', ResourceType.PROPERTY, PROP_ID),
		)
		expect(result.current).toBe(false)
	})
})
