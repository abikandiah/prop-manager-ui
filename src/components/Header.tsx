import { Popover, PopoverContent, PopoverTrigger } from "@abumble/design-system/components/Popover";
import { cn } from "@abumble/design-system/utils";
import { Link  } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { useState } from "react";
import type {LinkComponentProps} from "@tanstack/react-router";
import type { onClickCallback } from "@abumble/design-system/types";
import bee from "@/assets/bee.svg";


function Header() {
	return (
		<>
			<header className="header h-10">
				<Link to={"/"}>
					<img
						className="h-8 w-8 mx-3"
						src={bee}
						alt="Home Bee"
					/>
				</Link>

				<div className="md:hidden flex my-1.5">
					<HamburgerMenu />
				</div>

				<nav className="hidden md:block px-3">
					<RouteLinks className="flex" />
				</nav>
			</header>
		</>
	);
}

function HamburgerMenu() {
	const [open, setOpen] = useState(false);

	function closeMenu() {
		setOpen(false);
	}

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger className="mx-3">
				<Menu />
			</PopoverTrigger>

			<PopoverContent className="mx-3 w-48 p-0 mt-2">
				<RouteLinks onClose={closeMenu} />
			</PopoverContent >
		</Popover>
	)
}

interface RouteLinksProps extends React.ComponentProps<"ul"> {
	onClose?: onClickCallback<HTMLAnchorElement>;
}

function RouteLinks({ className, onClose, ...props }: RouteLinksProps) {
	return (
		<ul
			className={cn("rounded text-sm font-medium", className)}
			{...props}
		>
			<ListNavLink to="/" text={'Home'} onClick={onClose} />
			<ListNavLink to="/props" text={'Props'} onClick={onClose} />
			<ListNavLink to="/messages" text={'Messages'} onClick={onClose} />
		</ul>
	)
}

function ListNavLink(props: React.ComponentProps<typeof NavLink>) {
	return (
		<li>
			<NavLink {...props} />
		</li>
	)
}

function NavLink({ text, ...props }: { text: string } & LinkComponentProps) {
	return (
		<Link className="nav-link"
			activeProps={{ className: 'nav-link-active' }}
			{...props}
		>
			{({ isActive }: { isActive: boolean }) => {
				return (
					<>
						{isActive && (
							<span className="absolute inset-x-1 -bottom-px h-px bg-linear-to-r from-gray-500/0 via-gray-500/60 to-gray-500/10
                                dark:from-gray-400/0 dark:via-gray-400/60 dark:to-gray-400/0"></span>
						)}
						{text}
					</>
				)
			}}
		</Link>
	);
}



export default Header;

