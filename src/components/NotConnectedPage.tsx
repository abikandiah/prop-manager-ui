import { BannerLandingPage } from '@/components/pages'
import { MessageBanner } from '@abumble/design-system/components/Banner'
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from '@abumble/design-system/components/Empty'
import { ServerOff } from 'lucide-react'

export function NotConnectedPage() {
	return (
		<BannerLandingPage hideOfflineBanner>
			<MessageBanner
				type="info"
				message="Sadly, the backend server does not run 24/7 and is most likely offline."
			/>
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
