function Footer() {
	return (
		<footer className="mt-auto w-full px-6 py-8">
			<div className="flex flex-col items-center justify-center md:items-end md:justify-end">
				<div className="flex items-center gap-3">
					<span className="text-sm text-muted-foreground font-medium">
						© 2026 Abilaesh Kandiah
					</span>
					{/* <div className="h-4 w-px bg-border/80" aria-hidden="true" />
					<ExternalSite
						url="https://github.com/abikandiah/prop-manager"
						src={github}
						alt="GitHub Repository"
						className="transition-all hover:opacity-70 active:scale-95 grayscale hover:grayscale-0"
						aria-label="View Project on GitHub"
						title="Visit the GitHub project"
					/> */}
				</div>
			</div>
		</footer>
	)
}

export default Footer
