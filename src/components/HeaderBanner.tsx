import { useHeaderBanner } from '@/contexts/header-banner'
import { MessageBanner } from '@abumble/design-system/components/Banner'
import { cn } from '@abumble/design-system/utils'

/** Fixed banner stack rendered just below the header, overlaying page content. */
export function HeaderBanner() {
	const { banners, hideBanner } = useHeaderBanner()

	if (banners.length === 0) return null

	return (
		<div className="fixed top-14 left-0 right-0 z-40 flex flex-col">
			{banners.map(({ id, onClose, className, ...bannerProps }) => (
				<MessageBanner
					key={id}
					{...bannerProps}
					className={cn('header-banner', className)}
					onClose={
						onClose !== undefined
							? () => {
									onClose()
									hideBanner(id)
								}
							: undefined
					}
				/>
			))}
		</div>
	)
}
