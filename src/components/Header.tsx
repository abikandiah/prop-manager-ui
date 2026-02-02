import bee from '@/assets/bee.svg'
import { Button } from '@abumble/design-system/components/Button'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@abumble/design-system/components/Popover'
import { cn } from '@abumble/design-system/utils'
import { useTheme } from '@/contexts/theme'
import { Link } from '@tanstack/react-router'
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

			<div className="flex items-center">
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

const userMenuLinkClass =
	'flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted text-foreground text-sm'

const userMenuLinks = [
	{ to: '/profile', label: 'Profile', icon: UserRound },
	{ to: '/settings', label: 'Settings', icon: Settings },
] as const

function UserProfile() {
	const [open, setOpen] = useState(false)
	const close = () => setOpen(false)

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger
				className={cn(
					'flex items-center justify-center size-9 rounded-full',
					'hover:bg-muted hover:text-foreground',
					'ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
				)}
				aria-label="User menu"
			>
				<UserRound className="size-5" />
			</PopoverTrigger>
			<PopoverContent align="end" className="w-52 p-0 mt-2">
				<div className="px-3 py-2 border-b border-border">
					<p className="font-medium truncate text-foreground">Signed in</p>
					<p className="text-xs text-muted-foreground truncate">
						user@example.com
					</p>
				</div>
				<ul className="py-1.5">
					{userMenuLinks.map(({ to, label, icon: Icon }) => (
						<li key={to}>
							<Link
								to={to}
								className={cn(userMenuLinkClass, 'w-full px-3')}
								onClick={close}
							>
								<Icon className="size-4 shrink-0" />
								{label}
							</Link>
						</li>
					))}
					<li className="mt-1.5 pt-1.5 border-t border-border">
						<Button
							type="button"
							variant="ghost"
							className={cn(userMenuLinkClass, 'w-full justify-start px-3')}
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
