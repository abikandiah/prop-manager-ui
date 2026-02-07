import { cn } from '@abumble/design-system/utils'
import { Link } from '@tanstack/react-router'
import { cva } from 'class-variance-authority'
import type { LinkComponentProps } from '@tanstack/react-router'
import type { VariantProps } from 'class-variance-authority'

export function Spinner({ className }: { className?: string }) {
	return (
		<div className={cn('relative flex items-center justify-center', className)}>
			{/* Slow outer ring */}
			<div className="absolute inset-0 animate-[spin_3s_linear_infinite] rounded-full border-[3px] border-primary/10 border-t-primary/30" />

			{/* Medium reverse inner ring */}
			<div className="absolute inset-2 animate-[spin_2s_linear_infinite_reverse] rounded-full border-[3px] border-primary/10 border-b-primary/20" />

			{/* Fast main orbital segment */}
			<svg
				className="absolute inset-0 h-full w-full animate-[spin_1.5s_cubic-bezier(0.4,0,0.2,1)_infinite]"
				viewBox="0 0 100 100"
			>
				<circle
					cx="50"
					cy="50"
					r="42"
					fill="none"
					stroke="currentColor"
					strokeWidth="6"
					strokeDasharray="60 200"
					strokeLinecap="round"
					className="text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]"
				/>
			</svg>

			{/* Subtle core pulse (no dot, just light) */}
			<div className="h-4 w-4 animate-pulse rounded-full bg-primary/5 blur-sm" />
		</div>
	)
}

export function LoadingScreen() {
	return (
		<div className="flex flex-col items-center justify-center flex-1">
			<div className="relative mb-8">
				<Spinner className="h-24 w-24" />
				{/* Background ambient glow */}
				<div className="absolute inset-0 -z-10 animate-pulse bg-primary/10 blur-[100px]" />
			</div>

			<div className="flex flex-col items-center text-center">
				<div className="space-y-1">
					<h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
						PropMange
					</h2>
				</div>

				<div className="mt-4 flex flex-col items-center gap-2">
					<p className="text-sm font-medium text-muted-foreground">
						Verifying session
					</p>
					<div className="flex gap-1">
						<span className="h-1 w-1 animate-[pulse_1.5s_ease-in-out_infinite] rounded-full bg-primary" />
						<span className="h-1 w-1 animate-[pulse_1.5s_ease-in-out_0.2s_infinite] rounded-full bg-primary" />
						<span className="h-1 w-1 animate-[pulse_1.5s_ease-in-out_0.4s_infinite] rounded-full bg-primary" />
					</div>
				</div>
			</div>
		</div>
	)
}

export function TextLink({ className, ...props }: LinkComponentProps) {
	return <Link {...props} className={cn('text-link', className)} />
}

interface ExternalSiteProps {
	url: string
	src: string
	alt: string
}

export function ExternalSite({
	url,
	src,
	alt,
	...rest
}: ExternalSiteProps & React.ComponentProps<'a'>) {
	return (
		<a href={url} target="_blank" rel="noopener noreferrer" {...rest}>
			<img src={src} alt={alt} className="h-6 w-6" />
		</a>
	)
}

const pageHeaderVariants = cva('font-bold tracking-tight text-foreground', {
	variants: {
		size: {
			default: 'sm:text-3xl text-2xl',
			sm: 'sm:text-2xl text-xl',
		},
	},
	defaultVariants: {
		size: 'default',
	},
})
export function PageHeader({
	size,
	className,
	...props
}: React.ComponentProps<'h1'> & VariantProps<typeof pageHeaderVariants>) {
	return (
		<h1 className={cn(pageHeaderVariants({ size, className }))} {...props} />
	)
}

const pageDescriptionVariants = cva('text-muted-foreground', {
	variants: {
		size: {
			default: 'sm:text-xl text-lg',
			sm: 'sm:text-lg text-md',
		},
	},
	defaultVariants: {
		size: 'default',
	},
})
export function PageDescription({
	size,
	className,
	...props
}: React.ComponentProps<'p'> & VariantProps<typeof pageDescriptionVariants>) {
	return (
		<p
			className={cn(pageDescriptionVariants({ size, className }))}
			{...props}
		/>
	)
}

export interface BannerHeaderProps {
	title: React.ReactNode
	description: React.ReactNode
}

export function BannerHeader({ title, description }: BannerHeaderProps) {
	return (
		<div className="relative -mx-4 -mt-4 overflow-hidden border-b bg-card md:-mx-6 md:-mt-6">
			<div className="image-background absolute inset-0 opacity-10" />
			<div className="relative px-4 py-8 md:px-6 md:py-12">
				<div className="space-y-1.5">
					<PageHeader>{title}</PageHeader>
					<PageDescription>{description}</PageDescription>
				</div>
			</div>
		</div>
	)
}

export * from './Toaster'
