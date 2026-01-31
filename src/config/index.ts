import { stringToBoolean } from '@abumble/design-system/utils';

export const config = {
	constructionDisabled: stringToBoolean(import.meta.env.VITE_CONSTRUCTION_DISABLED)
};

