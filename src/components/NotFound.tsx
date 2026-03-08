import { NotFound as InternalNotFound } from '@abumble/design-system/components/NotFound'
import { BannerLandingPage } from './ui/pages'
import { TextLink } from './ui'

function NotFound() {
	return (
		<BannerLandingPage>
			<InternalNotFound>
				<TextLink to="/">Return home</TextLink>
			</InternalNotFound>
		</BannerLandingPage>
	)
}

export { NotFound }
