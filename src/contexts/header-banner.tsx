import type { TBannerType } from '@abumble/design-system/components/Banner'
import {
	createContext,
	useCallback,
	useContext,
	useState,
	type ReactNode,
} from 'react'

export interface HeaderBannerConfig {
	type: TBannerType
	message: string | ReactNode
	title?: string
	loading?: boolean
	hideIcon?: boolean
	/** Custom close handler — if omitted, no close button is shown. */
	onClose?: () => void
	className?: string
}

export interface HeaderBannerEntry extends HeaderBannerConfig {
	id: string
}

const MAX_BANNERS = 3
let _nextId = 0

interface HeaderBannerContextValue {
	banners: HeaderBannerEntry[]
	/** Add a banner. Returns its ID. If at capacity, the oldest is dropped (FIFO). */
	showBanner: (config: HeaderBannerConfig) => string
	/** Update an existing banner's config in-place (preserves queue position). */
	updateBanner: (id: string, config: Partial<HeaderBannerConfig>) => void
	/** Remove a specific banner by ID. */
	hideBanner: (id: string) => void
	/** Remove all banners. */
	clearBanners: () => void
}

const HeaderBannerContext = createContext<HeaderBannerContextValue | null>(null)

export function HeaderBannerProvider({ children }: { children: ReactNode }) {
	const [banners, setBanners] = useState<HeaderBannerEntry[]>([])

	const showBanner = useCallback((config: HeaderBannerConfig): string => {
		const id = `banner-${++_nextId}`
		setBanners((prev) => {
			const next = [...prev, { ...config, id }]
			// Drop oldest if over capacity
			return next.length > MAX_BANNERS
				? next.slice(next.length - MAX_BANNERS)
				: next
		})
		return id
	}, [])

	const updateBanner = useCallback(
		(id: string, config: Partial<HeaderBannerConfig>) => {
			setBanners((prev) =>
				prev.map((b) => (b.id === id ? { ...b, ...config } : b)),
			)
		},
		[],
	)

	const hideBanner = useCallback((id: string) => {
		setBanners((prev) => prev.filter((b) => b.id !== id))
	}, [])

	const clearBanners = useCallback(() => setBanners([]), [])

	return (
		<HeaderBannerContext.Provider
			value={{ banners, showBanner, updateBanner, hideBanner, clearBanners }}
		>
			{children}
		</HeaderBannerContext.Provider>
	)
}

export function useHeaderBanner() {
	const ctx = useContext(HeaderBannerContext)
	if (!ctx)
		throw new Error('useHeaderBanner must be used within HeaderBannerProvider')
	return ctx
}
