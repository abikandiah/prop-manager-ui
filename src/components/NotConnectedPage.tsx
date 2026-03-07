import { BannerLandingPage } from '@/components/pages'
import { useHeaderBanner } from '@/contexts/header-banner'
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from '@abumble/design-system/components/Empty'
import { ServerOff } from 'lucide-react'
import { useEffect, useRef } from 'react'

export function NotConnectedPage() {
	const { showBanner, hideBanner } = useHeaderBanner()
	const bannerIdRef = useRef<string | null>(null)

	useEffect(() => {
		bannerIdRef.current = showBanner({
			type: 'info',
			message: 'Sadly, the backend server does not run 24/7 and is most likely offline.',
		})
		return () => {
			if (bannerIdRef.current) hideBanner(bannerIdRef.current)
		}
	}, [showBanner, hideBanner])

	return (
		<BannerLandingPage>
			<Empty className="relative top-full">
				<EmptyHeader>
					<ServerOff size={128} className="mb-2" />
					<EmptyTitle className="text-3xl">Server unavailable</EmptyTitle>
					<EmptyDescription className="text-lg">
						We couldn't connect to the server. Try again in a moment.
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		</BannerLandingPage>
	)
}
