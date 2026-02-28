export const policyAssignmentKeys = {
	all: (orgId: string) => ['org', orgId, 'policy-assignments'] as const,
	lists: (orgId: string) =>
		[...policyAssignmentKeys.all(orgId), 'list'] as const,
	list: (orgId: string, membershipId: string) =>
		[...policyAssignmentKeys.lists(orgId), membershipId] as const,
	details: (orgId: string) =>
		[...policyAssignmentKeys.all(orgId), 'detail'] as const,
	detail: (orgId: string, membershipId: string, assignmentId: string) =>
		[
			...policyAssignmentKeys.details(orgId),
			membershipId,
			assignmentId,
		] as const,
}
