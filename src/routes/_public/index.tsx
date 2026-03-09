import { authQueryOptions } from '@/features/auth'
import { cn } from '@abumble/design-system/utils'
import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import {
	BarChart2,
	Building2,
	CheckCircle2,
	CreditCard,
	FileText,
	Mail,
	MessageSquare,
	Shield,
	ShieldCheck,
	Smartphone,
	Users,
} from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Pie, PieChart } from 'recharts'

export const Route = createFileRoute('/_public/')({
	beforeLoad: ({ context }) => {
		// Cache-only check — no network request on the public landing page
		const user = context.globalClient.getQueryData(authQueryOptions.queryKey)
		if (user) throw redirect({ to: '/home' })
	},
	component: Home,
})

// ─── Scroll-reveal hook ────────────────────────────────────────────────────────

function useReveal(ref: React.RefObject<HTMLElement | null>) {
	useEffect(() => {
		const el = ref.current
		if (!el) return
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					el.classList.add('revealed')
					observer.disconnect()
				}
			},
			{ threshold: 0.15 },
		)
		observer.observe(el)
		return () => observer.disconnect()
	}, [ref])
}

// ─── Static data ──────────────────────────────────────────────────────────────

const capabilities = [
	{ icon: FileText, label: 'Lease management' },
	{ icon: Building2, label: 'Portfolio tracking' },
	{ icon: Users, label: 'Tenant portal' },
	{ icon: CreditCard, label: 'Rent collection' },
	{ icon: MessageSquare, label: 'Messaging' },
	{ icon: ShieldCheck, label: 'Document storage' },
]

const orbitIcons = [Mail, CreditCard, FileText, BarChart2, Shield, Smartphone]

const occupancyData = [
	{ value: 87, fill: 'var(--color-hive)' },
	{ value: 13, fill: 'var(--muted)' },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

function Home() {
	return (
		<main className="flex flex-1 flex-col overflow-hidden">
			<HeroSection />
			<CapabilityBar />
			<BentoSection />
			<IntegrationSection />
			<PreFooterCTA />
		</main>
	)
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function HeroSection() {
	return (
		<section
			className="relative w-full overflow-hidden bg-canopy"
			aria-label="Hero"
		>
			{/* Dot-grid background */}
			<div
				className="pointer-events-none absolute inset-0"
				aria-hidden="true"
				style={{
					backgroundImage:
						'radial-gradient(circle, color-mix(in srgb, var(--color-hive) 18%, transparent) 1px, transparent 1px)',
					backgroundSize: '24px 24px',
				}}
			/>

			<div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-12 px-12 py-24 lg:grid-cols-2 lg:items-center lg:py-32">
				{/* Copy */}
				<div className="flex flex-col items-center text-center lg:items-start lg:text-left">
					<h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
						Property management,{' '}
						<span className="text-hive">uncomplicated.</span>
					</h1>
					<p className="mt-6 max-w-lg text-lg leading-relaxed text-white/70">
						PropMange helps you track your rentals, manage leases, and stay on
						top of the details — without the spreadsheets.
					</p>
					<div className="mt-10 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
						{/* Lime pill — works reliably on dark canopy bg */}
						<Link
							to="/home"
							className="inline-flex h-11 items-center justify-center rounded-full bg-hive px-12 text-sm font-semibold text-canopy transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hive focus-visible:ring-offset-2 focus-visible:ring-offset-canopy"
						>
							Get started
						</Link>
						{/* Ghost outline — transparent bg avoids design-system overrides */}
						<Link
							to="/home"
							className="inline-flex h-11 items-center justify-center rounded-full border border-white/30 bg-transparent px-12 text-sm font-medium text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
						>
							Sign in
						</Link>
					</div>
				</div>

				{/* Mock UI card */}
				<div className="hidden lg:flex lg:justify-center" aria-hidden="true">
					<MockDashboard />
				</div>
			</div>
		</section>
	)
}

function MockDashboard() {
	return (
		<div className="animate-float w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
			<div className="mb-4 flex items-center justify-between">
				<span className="text-xs font-semibold uppercase tracking-widest text-white/50">
					Portfolio
				</span>
				<span className="rounded-full bg-hive/20 px-2 py-0.5 text-xs font-medium text-hive">
					3 active
				</span>
			</div>

			{[
				{ name: 'Maple House', units: '4 units', status: 'Occupied' },
				{ name: 'Pine Apartments', units: '12 units', status: 'Occupied' },
				{ name: 'Oak Studio', units: '1 unit', status: 'Vacant' },
			].map(({ name, units, status }) => (
				<div
					key={name}
					className="mb-3 flex items-center justify-between rounded-xl bg-white/5 px-4 py-3"
				>
					<div>
						<p className="text-sm font-medium text-white">{name}</p>
						<p className="text-xs text-white/50">{units}</p>
					</div>
					<span
						className={cn(
							'rounded-full px-2 py-0.5 text-xs font-medium',
							status === 'Occupied'
								? 'bg-hive/20 text-hive'
								: 'bg-white/10 text-white/50',
						)}
					>
						{status}
					</span>
				</div>
			))}

			<div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
				<span className="text-xs text-white/50">Monthly rent collected</span>
				<span className="text-sm font-semibold text-hive">$7,400</span>
			</div>
		</div>
	)
}

// ─── Capability bar ───────────────────────────────────────────────────────────

function CapabilityBar() {
	const ref = useRef<HTMLDivElement>(null)
	useReveal(ref)

	return (
		<section
			className="w-full bg-parchment dark:bg-background"
			aria-label="Features"
		>
			<div ref={ref} className="reveal mx-auto max-w-7xl px-12 py-14">
				<p className="mb-8 text-center text-sm font-medium text-muted-foreground">
					Everything an independent landlord needs, in one place.
				</p>
				<div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:justify-center">
					{capabilities.map(({ icon: Icon, label }) => (
						<div
							key={label}
							className="flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground"
						>
							<Icon
								className="size-4 shrink-0 text-primary"
								aria-hidden="true"
							/>
							{label}
						</div>
					))}
				</div>
			</div>
		</section>
	)
}

// ─── Bento grid ───────────────────────────────────────────────────────────────

function BentoSection() {
	const ref = useRef<HTMLDivElement>(null)
	useReveal(ref)

	return (
		<section
			className="w-full bg-parchment dark:bg-background"
			aria-label="Product features"
		>
			<div ref={ref} className="reveal mx-auto max-w-7xl px-12 pb-24">
				<h2 className="mb-4 text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
					Built for how landlords actually work
				</h2>
				<p className="mb-12 text-center text-base text-muted-foreground">
					From signing leases to collecting rent — everything in the same place.
				</p>

				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					<div className="rounded-2xl border border-border bg-card p-6 sm:col-span-2 lg:col-span-1">
						<p className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
							Lease automation
						</p>
						<h3 className="mb-6 text-base font-semibold text-foreground">
							From draft to signed in minutes
						</h3>
						<LeaseTimeline />
					</div>

					<div className="rounded-2xl border border-border bg-card p-6">
						<p className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
							Tenant portal
						</p>
						<h3 className="mb-6 text-base font-semibold text-foreground">
							Tenants handle it themselves
						</h3>
						<TenantPortalPreview />
					</div>

					<div className="rounded-2xl border border-border bg-card p-6">
						<p className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
							Portfolio health
						</p>
						<h3 className="mb-6 text-base font-semibold text-foreground">
							Know your occupancy at a glance
						</h3>
						<OccupancyChart />
					</div>
				</div>
			</div>
		</section>
	)
}

function LeaseTimeline() {
	const steps = [
		{ label: 'Draft', done: true },
		{ label: 'Sent', done: true },
		{ label: 'Signed', done: true },
		{ label: 'Active', done: false, current: true },
	]
	return (
		<div className="flex items-center gap-0">
			{steps.map(({ label, done, current }, i) => (
				<div key={label} className="flex flex-1 items-center">
					<div className="flex flex-col items-center gap-1.5">
						<div
							className={cn(
								'flex size-6 items-center justify-center rounded-full border-2 text-xs font-bold',
								done
									? 'border-hive bg-hive text-canopy'
									: current
										? 'border-primary bg-primary text-primary-foreground'
										: 'border-border bg-muted text-muted-foreground',
							)}
						>
							{done ? (
								<CheckCircle2 className="size-3.5" aria-hidden="true" />
							) : (
								i + 1
							)}
						</div>
						<span className="text-[10px] font-medium text-muted-foreground">
							{label}
						</span>
					</div>
					{i < steps.length - 1 && (
						<div
							className={cn(
								'mb-4 h-0.5 flex-1',
								done ? 'bg-hive' : 'bg-border',
							)}
							aria-hidden="true"
						/>
					)}
				</div>
			))}
		</div>
	)
}

function TenantPortalPreview() {
	return (
		<div className="flex flex-col gap-3">
			<div className="max-w-[85%] self-start rounded-2xl rounded-tl-sm bg-muted px-4 py-2.5 text-sm text-foreground">
				Hi, can I pay this month&apos;s rent early?
			</div>
			<div className="max-w-[85%] self-end rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">
				Of course! I&apos;ll send a payment link now.
			</div>
			<div className="mt-2 flex items-center gap-2 self-center rounded-full border border-hive/30 bg-hive/10 px-4 py-2 text-xs font-semibold text-hive">
				<CheckCircle2 className="size-3.5" aria-hidden="true" />
				Rent received — $1,850
			</div>
		</div>
	)
}

function OccupancyChart() {
	return (
		<div className="flex flex-col items-center gap-4">
			<div className="relative flex items-center justify-center">
				<PieChart width={140} height={140} aria-hidden="true">
					<Pie
						data={occupancyData}
						cx={65}
						cy={65}
						innerRadius={42}
						outerRadius={58}
						startAngle={90}
						endAngle={-270}
						dataKey="value"
						stroke="none"
					/>
				</PieChart>
				<div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
					<span className="text-xl font-bold text-foreground">87%</span>
					<span className="text-xs text-muted-foreground">occupied</span>
				</div>
			</div>
			<div className="flex gap-4 text-xs text-muted-foreground">
				<div className="flex items-center gap-1.5">
					<div className="size-2 rounded-full bg-hive" aria-hidden="true" />
					Occupied
				</div>
				<div className="flex items-center gap-1.5">
					<div className="size-2 rounded-full bg-muted" aria-hidden="true" />
					Vacant
				</div>
			</div>
		</div>
	)
}

// ─── Integration section ──────────────────────────────────────────────────────

function IntegrationSection() {
	const ref = useRef<HTMLDivElement>(null)
	useReveal(ref)

	return (
		<section className="w-full bg-canopy" aria-label="Integrations">
			<div ref={ref} className="reveal mx-auto max-w-7xl px-12 py-24">
				<div className="flex flex-col items-center gap-16 lg:flex-row lg:items-center lg:justify-between">
					{/* Orbit visual */}
					<div
						className="relative flex size-64 shrink-0 items-center justify-center lg:size-80"
						aria-hidden="true"
					>
						<div className="absolute inset-0 rounded-full border border-white/10" />
						<div className="animate-spin-slow absolute inset-0">
							{orbitIcons.map((Icon, i) => {
								const angle = (i / orbitIcons.length) * 360
								return (
									<div
										key={i}
										className="absolute left-1/2 top-1/2"
										style={{
											transform: `rotate(${angle}deg) translate(0, -120px) rotate(-${angle}deg)`,
										}}
									>
										<div className="flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-sm">
											<Icon className="size-4 text-white/70" />
										</div>
									</div>
								)
							})}
						</div>
						<div className="relative z-10 flex size-16 items-center justify-center rounded-full border border-hive/30 bg-hive/10">
							<span className="text-3xl" role="img" aria-label="PropMange">
								🐝
							</span>
						</div>
					</div>

					{/* Copy */}
					<div className="max-w-lg text-center lg:text-left">
						<h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
							Built to connect, <span className="text-hive">not replace.</span>
						</h2>
						<p className="mt-4 text-base leading-relaxed text-white/70">
							PropMange is designed with an open, API-first architecture. Plug
							in the payment processor, accounting tool, or communication
							channel you already use — no lock-in, no migration headaches.
						</p>
						<p className="mt-3 text-base leading-relaxed text-white/70">
							Your property management hub, not another silo.
						</p>
					</div>
				</div>
			</div>
		</section>
	)
}

// ─── Pre-footer CTA ───────────────────────────────────────────────────────────

function PreFooterCTA() {
	const ref = useRef<HTMLDivElement>(null)
	useReveal(ref)

	return (
		<section
			className="w-full bg-parchment dark:bg-background"
			aria-label="Call to action"
		>
			<div
				ref={ref}
				className="reveal mx-auto flex max-w-md flex-col items-center px-12 py-24 text-center"
			>
				<h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
					Ready to simplify your rentals?
				</h2>
				<p className="mt-4 text-base text-muted-foreground">
					Get started for free. No credit card required.
				</p>
				<Link
					to="/home"
					className="mt-8 inline-flex h-11 items-center justify-center rounded-full bg-canopy px-8 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-canopy focus-visible:ring-offset-2 dark:bg-hive dark:text-canopy"
				>
					Get started
				</Link>
			</div>
		</section>
	)
}
