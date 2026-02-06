import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Skeleton } from '@abumble/design-system/components/Skeleton'
import ReactMarkdown from 'react-markdown'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { api } from '@/api/client'

export const Route = createFileRoute('/public/terms')({
	component: RouteComponent,
})

function RouteComponent() {
	const { data, isLoading, isError, error } = useQuery({
		queryKey: ['public', 'terms'],
		queryFn: async () => {
			const res = await api.get<LegalResponse>('/public/terms')
			return res.data
		},
	})

	useEffect(() => {
		if (isError) {
			toast.error(
				'Unable to load Terms right now. Please try again in a moment.',
			)
		}
	}, [isError, error])

	if (isLoading) {
		return (
			<div className="center-page w-full p-4 md:p-6">
				<div className="flex flex-col gap-2">
					<Skeleton className="h-9 w-64" />
					<Skeleton className="h-4 w-48" />
				</div>

				<div className="mt-6 flex flex-col gap-6">
					<div className="flex flex-col gap-2">
						<Skeleton className="h-8 w-[88%]" />
						<Skeleton className="h-8 w-full" />
						<Skeleton className="h-8 w-[76%]" />
					</div>

					<div className="flex flex-col gap-2">
						<Skeleton className="h-8 w-[80%]" />
						<Skeleton className="h-8 w-[94%]" />
						<Skeleton className="h-8 w-[68%]" />
					</div>

					<div className="flex flex-col gap-2">
						<Skeleton className="h-8 w-[86%]" />
						<Skeleton className="h-8 w-[98%]" />
						<Skeleton className="h-8 w-[72%]" />
					</div>

					<div className="flex flex-col gap-2">
						<Skeleton className="h-8 w-[78%]" />
						<Skeleton className="h-8 w-[92%]" />
						<Skeleton className="h-8 w-[70%]" />
					</div>
				</div>
			</div>
		)
	}

	if (isError) {
		return (
			<div className="center-page w-full p-4 md:p-6">
				<h1 className="text-2xl font-semibold text-foreground">Terms</h1>
				<p className="mt-2 text-sm text-muted-foreground">
					We couldn’t load this document right now.
				</p>
			</div>
		)
	}

	if (!data) return null

	return (
		<div className="center-page w-full p-4 md:p-6">
			<article className="prose prose-sm prose-zinc max-w-none dark:prose-invert">
				<ReactMarkdown>{data.content}</ReactMarkdown>
			</article>
		</div>
	)
}

type LegalResponse = {
	title: string
	content: string
	lastUpdated: string
}
