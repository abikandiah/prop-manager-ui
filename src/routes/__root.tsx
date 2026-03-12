import Footer from '@/components/Footer'
import Header from '@/components/Header'
import { HeaderBanner } from '@/components/HeaderBanner'
import { config } from '@/config'
import { HeaderBannerProvider, useHeaderBanner } from '@/contexts/header-banner'
import { useNetwork } from '@/contexts/network'
import { useTheme } from '@/contexts/theme'
import { useAuth } from '@/features/auth'
import type { MyRouterContext } from '@/integrations/tanstack-query/router'
import { Toaster } from '@abumble/design-system/components/Toaster'
import { UnderConstruction } from '@abumble/design-system/components/UnderConstruction'
import { stringToBoolean } from '@abumble/design-system/utils'
import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import { WifiOff } from 'lucide-react'
import { useEffect, useRef } from 'react'

export const Route = createRootRouteWithContext<MyRouterContext>()({
	component: Root,
})

function Root() {
	const { effectiveTheme } = useTheme()

	if (!config.constructionDisabled) {
		return (
			<div className="flex flex-col h-full">
				<div className="flex grow justify-center">
					<UnderConstruction />
				</div>
				<Footer />
			</div>
		)
	}

	return (
		<HeaderBannerProvider>
			<div className="flex flex-col min-h-screen w-full">
				<Toaster theme={effectiveTheme} position="bottom-right" />
				<Header />
				<HeaderBanner />
				<EnvironmentBannerEffect />
				<OfflineBannerEffect />
				<Outlet />
				<Footer />
			</div>
		</HeaderBannerProvider>
	)
}

const DISCLAIMER_KEY = 'prop_mange_disclaimer_dismissed'

function EnvironmentBannerEffect() {
	const { showBanner, hideBanner } = useHeaderBanner()
	const bannerIdRef = useRef<string | null>(null)

	useEffect(() => {
		if (stringToBoolean(localStorage.getItem(DISCLAIMER_KEY))) return

		bannerIdRef.current = showBanner({
			type: 'info',
			message:
				'This is a sandbox environment. It is not intended for business or commercial use. No warranty, uptime guarantees, or technical support are provided.',
			onClose: () => localStorage.setItem(DISCLAIMER_KEY, 'true'),
		})

		return () => {
			if (bannerIdRef.current) hideBanner(bannerIdRef.current)
		}
	}, [showBanner, hideBanner])

	return null
}

function OfflineBannerEffect() {
	const { isOnline, isServerReachable, consecutiveFailures } = useNetwork()
	const { showBanner, updateBanner, hideBanner } = useHeaderBanner()
	const { isUserDefined } = useAuth()
	const bannerIdRef = useRef<string | null>(null)

	useEffect(() => {
		if (!isUserDefined || isOnline) {
			if (bannerIdRef.current) {
				hideBanner(bannerIdRef.current)
				bannerIdRef.current = null
			}
			return
		}

		const message = (
			<span className="flex flex-col gap-1">
				<span className="flex items-center gap-2">
					{isOnline ? (
						<span>
							Server unavailable. Changes will sync when the server is back
							online.
						</span>
					) : (
						<>
							<WifiOff className="size-4 shrink-0" aria-hidden />
							<span>
								You're offline. Changes will sync when you're back online.
							</span>
						</>
					)}
				</span>
				{config.isDevelopment && consecutiveFailures > 0 && (
					<span className="text-xs opacity-75">
						Debug: {consecutiveFailures} consecutive failures
					</span>
				)}
			</span>
		)

		if (bannerIdRef.current) {
			updateBanner(bannerIdRef.current, { message })
		} else {
			bannerIdRef.current = showBanner({ type: 'alert', message })
		}
	}, [
		isUserDefined,
		isOnline,
		isServerReachable,
		consecutiveFailures,
		showBanner,
		updateBanner,
		hideBanner,
	])

	useEffect(
		() => () => {
			if (bannerIdRef.current) hideBanner(bannerIdRef.current)
		},
		[hideBanner],
	)

	return null
}
