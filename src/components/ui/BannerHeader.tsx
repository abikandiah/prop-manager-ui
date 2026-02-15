import { Link } from '@tanstack/react-router'
import { BannerHeader as DesignSystemBannerHeader } from '@abumble/design-system/components/BannerHeader'
import type {
	BannerBackLinkOptions,
	BannerHeaderProps,
	BreadcrumbItemType,
} from '@abumble/design-system/components/BannerHeader'

export type { BannerHeaderProps, BreadcrumbItemType, BannerBackLinkOptions }

/**
 * Banner header with TanStack Router integration. Wraps design-system BannerHeader with linkComponent={Link}.
 */
export function BannerHeader(props: BannerHeaderProps) {
	return <DesignSystemBannerHeader linkComponent={Link} {...props} />
}
