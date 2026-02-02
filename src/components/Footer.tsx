import { TextLink } from './ui'

interface FooterProps {
	showLinks?: boolean
}

function Footer({ showLinks = false }: FooterProps) {
	return (
		<footer className="mt-auto px-3">
			<div className="py-8 px-6 mt-18">
				<div className="flex flex-col md:items-end items-center gap-1">
					{showLinks && (
						<TextLink
							className="text-sm"
							to="/"
							target="_blank"
							activeProps={{ className: 'hidden' }}
						>
							Home
						</TextLink>
					)}
					<span className="text-sm text-gray-500">
						© 2026 Abilaesh Kandiah. All rights reserved.
					</span>
				</div>
			</div>
		</footer>
	)
}

export default Footer
