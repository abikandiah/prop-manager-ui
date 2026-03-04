import { createFileRoute, redirect } from '@tanstack/react-router'
import { z } from 'zod'

const searchSchema = z.object({
	orgId: z.string().optional(),
})

export const Route = createFileRoute(
	'/_auth/_org/_dashboard/settings/permission-templates',
)({
	validateSearch: searchSchema,
	beforeLoad: ({ search }) => {
		throw redirect({
			to: '/settings/permission-policies',
			search,
		})
	},
	component: () => null,
})
