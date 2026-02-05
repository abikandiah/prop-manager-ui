import { cn } from '@abumble/design-system/utils'
import { Link } from '@tanstack/react-router'
import { cva } from 'class-variance-authority'
import type { LinkComponentProps } from '@tanstack/react-router'
import type { VariantProps } from 'class-variance-authority'

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
			default: 'sm:text-4xl text-3xl',
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
			default: 'sm:text-2xl text-xl',
			sm: 'sm:text-xl text-lg',
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

export * from './Toaster'
