import { ResourceType } from '@/domain/policy-assignment'
import { AppRole } from '@/domain/user'
import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Actions, useCan, type AccessEntry } from './permissions'

const ORG_ID = 'org-1'
const PROP_ID = 'prop-1'

const mockAccess: AccessEntry[] = [
	{
		orgId: ORG_ID,
		scopeType: ResourceType.ORG,
		scopeId: ORG_ID,
		permissions: { p: Actions.READ | Actions.CREATE }, // PORTFOLIO read+create
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
				organizations: [],
				roles: [AppRole.ADMIN],
				access: [],
			},
			isLoadingUser: false,
			isUserDefined: true,
			error: null,
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
			error: null,
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
				organizations: [],
				roles: [AppRole.MANAGER],
				access: mockAccess,
			},
			isLoadingUser: false,
			isUserDefined: true,
			error: null,
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
				organizations: [],
				roles: [AppRole.MANAGER],
				access: mockAccess,
			},
			isLoadingUser: false,
			isUserDefined: true,
			error: null,
			logout: vi.fn(),
			refreshUser: vi.fn(),
		})
		const { result } = renderHook(() =>
			useCan('UPDATE', 'PORTFOLIO', ResourceType.PROPERTY),
		)
		expect(result.current).toBe(false)
	})

	it('returns false when access list has no matching entry for a scoped check', () => {
		mockUseAuth.mockReturnValue({
			user: {
				id: '1',
				email: '',
				name: '',
				termsAccepted: false,
				organizations: [],
				roles: [AppRole.MANAGER],
				access: mockAccess,
			},
			isLoadingUser: false,
			isUserDefined: true,
			error: null,
			logout: vi.fn(),
			refreshUser: vi.fn(),
		})
		const { result } = renderHook(() =>
			useCan('UPDATE', 'PORTFOLIO', ResourceType.PROPERTY, PROP_ID),
		)
		expect(result.current).toBe(false)
	})
})
