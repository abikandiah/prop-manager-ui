import Footer from '@/components/Footer'
import Header from '@/components/Header'
import { OnboardingForm } from '@/components/OnboardingForm'
import { BannerLandingPage } from '@/components/pages'
import { useOrganization } from '@/contexts/organization'
import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/_org')({
	component: OrgLayout,
})

function OrgLayout() {
	const { organizations } = useOrganization()

	if (organizations.length === 0) {
		return (
			<BannerLandingPage>
				<Header />
				<OnboardingForm />
				<Footer />
			</BannerLandingPage>
		)
	}

	return <Outlet />
}
