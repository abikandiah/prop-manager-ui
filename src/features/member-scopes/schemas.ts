import { z } from 'zod'

export const scopeConfigSchema = z
	.object({
		scopeType: z.enum(['ORG', 'PROPERTY', 'UNIT']),
		scopeId: z.string(),
		useTemplate: z.boolean(),
		templateId: z.string().optional(),
		permissions: z.record(z.string(), z.string()),
	})
	.refine(
		(data) => data.scopeType === 'ORG' || data.scopeId.trim().length > 0,
		{
			message: 'Scope ID is required',
			path: ['scopeId'],
		},
	)
	.refine(
		(data) => !data.useTemplate || (data.templateId?.trim().length ?? 0) > 0,
		{
			message: 'Select a template',
			path: ['templateId'],
		},
	)
	.refine(
		(data) =>
			data.useTemplate ||
			Object.values(data.permissions).some((v) => v.trim() !== ''),
		{
			message: 'Grant at least one permission',
			path: ['permissions'],
		},
	)
