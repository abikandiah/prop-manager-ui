import bee from '@/assets/bee.svg'
import { Button } from '@abumble/design-system/components/Button'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@abumble/design-system/components/Popover'
import { cn } from '@abumble/design-system/utils'
import { useTheme } from '@/contexts/theme'
import { Link, useRouterState } from '@tanstack/react-router'
import { Bell, LogOut, Moon, Settings, Sun, UserRound } from 'lucide-react'
import { useState } from 'react'

function Header() {
	return (
		<header className="header">
			<Link to={'/'} className="flex items-center gap-2">
				<img className="h-8 w-8 shrink-0" src={bee} alt="Home Bee" />
				<span className="hidden text-lg font-semibold text-foreground sm:inline">
					Prop Manager
				</span>
			</Link>

			<div className="flex items-center gap-1">
				<ThemeToggle />
				<Button
					type="button"
					variant="ghost"
					size="icon"
					className="rounded-full"
					aria-label="Notifications"
				>
					<Bell className="size-5" />
				</Button>
				<UserProfile />
			</div>
		</header>
	)
}

function ThemeToggle() {
	const { setTheme, effectiveTheme } = useTheme()
	const isDark = effectiveTheme === 'dark'
	const toggle = () => setTheme(isDark ? 'light' : 'dark')
	return (
		<Button
			type="button"
			variant="ghost"
			size="icon"
			className="rounded-full"
			aria-label={isDark ? 'Dark mode on' : 'Dark mode off'}
			onClick={toggle}
		>
			{isDark ? <Moon className="size-5" /> : <Sun className="size-5" />}
		</Button>
	)
}

const userMenuLinkClass = `flex items-center gap-2 rounded p-2 h-8 w-full text-left text-sm outline-hidden ring-ring 
hover:bg-muted hover:text-foreground focus-visible:ring-2 text-foreground [&>svg]:size-4 [&>svg]:shrink-0`

const userMenuLinks = [
	{ to: '/profile', label: 'Profile', icon: UserRound },
	{ to: '/settings', label: 'Settings', icon: Settings },
] as const

function UserProfile() {
	const [open, setOpen] = useState(false)
	const close = () => setOpen(false)

	const pathname = useRouterState({ select: (s) => s.location.pathname })
	const isAccountPage = userMenuLinks.some(
		({ to }) => pathname === to || pathname.startsWith(to + '/'),
	)

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger
				className={cn(
					'flex items-center justify-center size-9 rounded-full',
					'hover:bg-muted hover:text-foreground',
					'ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
					isAccountPage &&
						'ring-1 ring-ring ring-offset-1 ring-offset-background bg-muted/80',
				)}
				aria-label="User menu"
			>
				<UserRound className="size-5" />
			</PopoverTrigger>
			<PopoverContent align="end" className="w-52 p-0 mt-2">
				<div className="border-b border-border px-3 py-2">
					<p className="truncate text-sm font-semibold text-foreground">
						Example User
					</p>
					<p className="truncate text-xs text-muted-foreground">
						user@example.com
					</p>
				</div>
				<ul className="flex flex-col gap-1 p-2">
					{userMenuLinks.map(({ to, label, icon: Icon }) => (
						<li key={to}>
							<Link to={to} className={userMenuLinkClass} onClick={close}>
								<Icon className="size-4 shrink-0" />
								{label}
							</Link>
						</li>
					))}
					<li className="mt-1.5 pt-1.5 border-t border-border">
						<Button
							type="button"
							variant="ghost"
							className={cn(userMenuLinkClass, 'justify-start')}
							onClick={close}
							aria-label="Sign out"
						>
							<LogOut className="size-4 shrink-0" />
							Sign out
						</Button>
					</li>
				</ul>
			</PopoverContent>
		</Popover>
	)
}

export default Header
