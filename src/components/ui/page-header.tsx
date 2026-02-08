import { cn } from '@abumble/design-system/utils'
import * as React from 'react'
import { cva } from 'class-variance-authority'
import type { VariantProps } from 'class-variance-authority'

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
