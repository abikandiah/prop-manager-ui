import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from 'react'

const STORAGE_KEY = 'theme'

export type Theme = 'light' | 'dark' | 'system'

function getStoredTheme(): Theme {
	if (typeof window === 'undefined') return 'system'
	const stored = localStorage.getItem(STORAGE_KEY)
	if (stored === 'light' || stored === 'dark' || stored === 'system')
		return stored
	return 'system'
}

function getEffectiveTheme(theme: Theme): 'light' | 'dark' {
	if (theme === 'system') {
		return window.matchMedia('(prefers-color-scheme: dark)').matches
			? 'dark'
			: 'light'
	}
	return theme
}

function applyTheme(effective: 'light' | 'dark') {
	const root = document.documentElement
	if (effective === 'dark') {
		root.classList.add('dark')
	} else {
		root.classList.remove('dark')
	}
}

interface ThemeContextValue {
	theme: Theme
	setTheme: (theme: Theme) => void
	effectiveTheme: 'light' | 'dark'
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
	const [theme, setThemeState] = useState<Theme>(getStoredTheme)
	const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>(() =>
		getEffectiveTheme(getStoredTheme()),
	)

	useEffect(() => {
		const effective = getEffectiveTheme(theme)
		setEffectiveTheme(effective)
		applyTheme(effective)
	}, [theme])

	useEffect(() => {
		if (theme !== 'system') return
		const media = window.matchMedia('(prefers-color-scheme: dark)')
		const handler = () => {
			const effective = getEffectiveTheme('system')
			setEffectiveTheme(effective)
			applyTheme(effective)
		}
		media.addEventListener('change', handler)
		return () => media.removeEventListener('change', handler)
	}, [theme])

	const setTheme = useCallback((next: Theme) => {
		setThemeState(next)
		localStorage.setItem(STORAGE_KEY, next)
	}, [])

	const value = useMemo<ThemeContextValue>(
		() => ({ theme, setTheme, effectiveTheme }),
		[theme, setTheme, effectiveTheme],
	)

	return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
	const ctx = useContext(ThemeContext)
	if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
	return ctx
}
