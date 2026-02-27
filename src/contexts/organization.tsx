import { setActiveOrgId } from '@/api/client'
import type { Organization } from '@/domain/organization'
import { createContext, useContext, useEffect } from 'react'
import { useAuth } from './auth'

interface OrganizationContextValue {
	activeOrgId: string | null
	activeOrg: Organization | null
	// User organizations
	organizations: Organization[]
}

const OrganizationContext = createContext<OrganizationContextValue | undefined>(
	undefined,
)

/**
 * Provides the active org context to the entire app.
 *
 * Phase 1: defaults to the user's first organization (read-only, no switcher).
 * Phase 5: will read activeOrgId from the URL search param (?orgId=) with fallback.
 *
 * Must be rendered inside AuthProvider and the user-scoped QueryClientProvider,
 * but OUTSIDE RouterProvider — it syncs org state to the Axios interceptor via
 * a module-level variable (not localStorage, which is shared across tabs).
 */
export function OrganizationProvider({
	children,
}: {
	children: React.ReactNode
}) {
	const { user } = useAuth()
	const organizations: Organization[] = user?.organizations ?? []

	// Phase 1: use the first org. Phase 5: read from URL search param.
	const activeOrg = organizations[0] ?? null

	// Bridge to the Axios interceptor. The interceptor is a plain module function
	// that cannot call React hooks, so we sync via a module-level variable.
	// Cleanup on unmount (logout) sets it back to null.
	useEffect(() => {
		setActiveOrgId(activeOrg?.id ?? null)
		return () => setActiveOrgId(null)
	}, [activeOrg?.id])

	return (
		<OrganizationContext.Provider
			value={{
				activeOrgId: activeOrg?.id ?? null,
				activeOrg,
				organizations,
			}}
		>
			{children}
		</OrganizationContext.Provider>
	)
}

/** Consume the active organization context. Must be used inside OrganizationProvider. */
export function useOrganization(): OrganizationContextValue {
	const ctx = useContext(OrganizationContext)
	if (!ctx) {
		throw new Error('useOrganization must be used inside OrganizationProvider')
	}
	return ctx
}
