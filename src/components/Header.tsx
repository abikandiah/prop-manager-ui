import { useAuth } from '@/features/auth'
import { BeeLogo } from '@abumble/design-system/components/BeeLogo'
import { Button } from '@abumble/design-system/components/Button'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@abumble/design-system/components/Popover'
import { ThemeToggle } from '@abumble/design-system/components/ThemeToggle'
import { cn } from '@abumble/design-system/utils'
import { Link, useRouterState } from '@tanstack/react-router'
import { Bell, LogOut, Settings, UserRound } from 'lucide-react'
import { useState } from 'react'

function Header() {
	const { isUserDefined } = useAuth()

	return (
		<header className="header">
			<BeeLogo>
				<Link to={'/'}>
					<span className="app-title hidden text-foreground sm:inline">
						PropMange
					</span>
				</Link>
			</BeeLogo>

			<div className="flex items-center gap-1 rounded-full">
				<ThemeToggle />

				{!isUserDefined && (
					<Button asChild variant="ghost" size="sm">
						<Link to="/home">Sign in</Link>
					</Button>
				)}
				{isUserDefined && (
					<>
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
					</>
				)}
			</div>
		</header>
	)
}

const userMenuItemClass =
	'flex items-center gap-2 rounded p-2 h-8 w-full text-left text-sm text-foreground [&>svg]:size-4 [&>svg]:shrink-0'

const userMenuLinks = [
	{ to: '/profile', label: 'Profile', icon: UserRound },
	{ to: '/settings', label: 'Settings', icon: Settings },
] as const

function UserProfile() {
	const [open, setOpen] = useState(false)
	const { user, logout } = useAuth()
	const close = () => setOpen(false)

	const pathname = useRouterState({ select: (s) => s.location.pathname })
	const isAccountPage = userMenuLinks.some(
		({ to }) => pathname === to || pathname.startsWith(to + '/'),
	)

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					type="button"
					variant="ghost"
					size="icon"
					className={cn('rounded-full', isAccountPage && 'bg-muted')}
					aria-label="User menu"
				>
					<UserRound className="size-5" />
				</Button>
			</PopoverTrigger>
			<PopoverContent align="end" className="w-52 p-0 mt-2">
				<div className="border-b border-border px-3 py-2">
					<p className="truncate text-sm font-semibold text-foreground">
						{user?.name || 'Guest'}
					</p>
					<p className="truncate text-xs text-muted-foreground">
						{user?.email || ''}
					</p>
				</div>
				<ul className="flex flex-col gap-1 p-2">
					{userMenuLinks.map(({ to, label, icon: Icon }) => (
						<li key={to}>
							<Button
								variant="ghost"
								asChild
								className={cn(userMenuItemClass, 'justify-start')}
							>
								<Link to={to} onClick={close}>
									<Icon className="size-4 shrink-0" />
									{label}
								</Link>
							</Button>
						</li>
					))}
					<li className="mt-1 pt-1 border-t border-border">
						<Button
							type="button"
							variant="ghost"
							className={cn(userMenuItemClass, 'justify-start')}
							onClick={logout}
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
