import { useState } from 'react'
import { toast } from 'sonner'
import { Copy, Shield } from 'lucide-react'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@abumble/design-system/components/Table'
import { DelayedLoadingFallback } from '@abumble/design-system/components/DelayedLoadingFallback'
import { FormDialog } from '@abumble/design-system/components/Dialog'
import { Badge } from '@abumble/design-system/components/Badge'
import type { PermissionPolicy } from '@/domain/permission-policy'
import { TableSkeleton, EntityActions } from '@/components/ui'
import { config } from '@/config'
import { formatDate } from '@/lib/format'
import { useAuth } from '@/contexts/auth'
import { useDeletePermissionPolicy, usePermissionPolicies } from '../../hooks'
import { PermissionPolicyForm } from '../forms/PermissionPolicyForm'
import { FORM_DIALOG_CLASS } from '@/lib/dialog'
import { useQueryErrorToast } from '@/lib/hooks'

export interface PermissionPoliciesTableViewProps {
	orgId: string
}

/** Summarises flat permissions as a short human-readable string, e.g. "l:rcud · m:r". */
function formatPermissions(
	permissions: PermissionPolicy['permissions'],
): string {
	const entries = Object.entries(permissions).filter(([, v]) => v)
	if (entries.length === 0) return '—'
	return entries.map(([k, v]) => `${k}:${v}`).join(' · ')
}

export function PermissionPoliciesTableView({
	orgId,
}: PermissionPoliciesTableViewProps) {
	const { user } = useAuth()
	const {
		data: policies,
		isLoading,
		isError,
		error,
	} = usePermissionPolicies(orgId)
	const deletePolicy = useDeletePermissionPolicy()
	const [editing, setEditing] = useState<PermissionPolicy | null>(null)
	const [duplicating, setDuplicating] = useState<PermissionPolicy | null>(null)

	const isGlobalAdmin = user?.roles?.includes('ROLE_ADMIN') ?? false

	useQueryErrorToast(isError, error as Error, 'policies')

	const handleDelete = (policy: PermissionPolicy) => {
		deletePolicy.mutate(policy.id, {
			onSuccess: () => toast.success(`Policy "${policy.name}" deleted`),
		})
	}

	const skeletonTable = (
		<TableSkeleton
			headers={['Name', 'Scope', 'Permissions', 'Created']}
			columnWidths={['w-48', 'w-24', 'w-64', 'w-24']}
		/>
	)

	return (
		<>
			<FormDialog
				open={editing !== null}
				onOpenChange={(open) => {
					if (!open) setEditing(null)
				}}
				title="Edit policy"
				description="Update the policy name or permissions."
				className={FORM_DIALOG_CLASS}
			>
				{editing && (
					<PermissionPolicyForm
						orgId={editing.orgId}
						initialPolicy={editing}
						onSuccess={() => setEditing(null)}
						onCancel={() => setEditing(null)}
						submitLabel="Save changes"
					/>
				)}
			</FormDialog>

			<FormDialog
				open={duplicating !== null}
				onOpenChange={(open) => {
					if (!open) setDuplicating(null)
				}}
				title="Duplicate policy"
				description="Create a copy of this system policy for your organization."
				className={FORM_DIALOG_CLASS}
			>
				{duplicating && (
					<PermissionPolicyForm
						orgId={orgId}
						prefill={{
							name: `Copy of ${duplicating.name}`,
							permissions: structuredClone(duplicating.permissions),
						}}
						onSuccess={() => setDuplicating(null)}
						onCancel={() => setDuplicating(null)}
						submitLabel="Create copy"
					/>
				)}
			</FormDialog>

			<DelayedLoadingFallback
				isLoading={isLoading}
				delayMs={config.loadingFallbackDelayMs}
				fallback={skeletonTable}
			>
				<div className="rounded border bg-card overflow-hidden">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Name</TableHead>
								<TableHead>Scope</TableHead>
								<TableHead>Permissions</TableHead>
								<TableHead>Created</TableHead>
								<TableHead className="w-10" />
							</TableRow>
						</TableHeader>
						<TableBody>
							{!policies || policies.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={5}
										className="h-24 text-center text-muted-foreground"
									>
										No policies yet. Create one above.
									</TableCell>
								</TableRow>
							) : (
								policies.map((policy) => {
									const isSystem = policy.orgId === null
									const canMutate = !isSystem || isGlobalAdmin
									return (
										<TableRow key={policy.id}>
											<TableCell className="font-medium">
												<span className="flex items-center gap-2">
													{policy.name}
													{isSystem && (
														<Badge
															variant="secondary"
															className="flex items-center gap-1 text-xs"
														>
															<Shield className="size-3" />
															System
														</Badge>
													)}
												</span>
											</TableCell>
											<TableCell className="text-muted-foreground text-sm">
												{isSystem ? 'System' : 'Organization'}
											</TableCell>
											<TableCell className="text-muted-foreground text-sm font-mono">
												{formatPermissions(policy.permissions)}
											</TableCell>
											<TableCell className="text-muted-foreground">
												{formatDate(policy.createdAt)}
											</TableCell>
											<TableCell>
												<EntityActions
													onEdit={canMutate ? () => setEditing(policy) : false}
													onDelete={() => handleDelete(policy)}
													isDeletePending={deletePolicy.isPending}
													disableDelete={!canMutate}
													deleteTitle={`Delete "${policy.name}"?`}
													deleteDescription="This policy will be permanently removed. Assignments that used it will keep their current permissions."
													stopTriggerPropagation
													additionalItems={
														isSystem
															? [
																	{
																		label: 'Duplicate',
																		icon: <Copy className="size-4 shrink-0" />,
																		onClick: () => setDuplicating(policy),
																	},
																]
															: []
													}
												/>
											</TableCell>
										</TableRow>
									)
								})
							)}
						</TableBody>
					</Table>
				</div>
			</DelayedLoadingFallback>
		</>
	)
}
