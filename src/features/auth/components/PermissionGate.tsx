import type { ReactNode } from 'react'
import { ResourceType } from '@/domain/policy-assignment'
import { useCan, type Actions, type PermissionDomains } from '@/lib/permissions'

interface PermissionGateProps {
	action: keyof typeof Actions
	domain: keyof typeof PermissionDomains
	scopeType?: ResourceType
	scopeId?: string
	/** Parent property ID — required when scopeType is UNIT for hierarchy resolution. */
	parentScopeId?: string
	children: ReactNode
	/** Rendered when access is denied. Defaults to null (hidden). */
	fallback?: ReactNode
}

/** Renders children when the user has the required permission; renders fallback (or nothing) otherwise. */
export function PermissionGate({
	action,
	domain,
	scopeType,
	scopeId,
	parentScopeId,
	children,
	fallback = null,
}: PermissionGateProps) {
	const allowed = useCan(action, domain, scopeType, scopeId, parentScopeId)
	return <>{allowed ? children : fallback}</>
}
