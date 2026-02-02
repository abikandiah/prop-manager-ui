import { stringToBoolean } from '@abumble/design-system/utils'

export const config = {
	constructionDisabled: stringToBoolean(import.meta.env.VITE_CONSTRUCTION_DISABLED) || false,
	apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '',
}

