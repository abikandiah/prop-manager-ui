import type { TenantLeaseSummary } from '@/domain/tenant-portal'
import { SectionCard } from '@/components/ui'
import { Button } from '@abumble/design-system/components/Button'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'

export function LeaseDocumentCard({ lease }: { lease: TenantLeaseSummary }) {
	const [open, setOpen] = useState(false)

	return (
		<SectionCard title="Lease document">
			{lease.executedContentMarkdown ? (
				<>
					<Button variant="outline" size="sm" onClick={() => setOpen(true)}>
						View lease agreement
					</Button>
					{open && (
						<div
							className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4"
							onClick={() => setOpen(false)}
						>
							<div
								className="relative w-full max-w-3xl rounded-lg bg-background p-6 shadow-xl"
								onClick={(e) => e.stopPropagation()}
							>
								<button
									className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
									onClick={() => setOpen(false)}
									aria-label="Close"
								>
									✕
								</button>
								<div className="prose prose-sm dark:prose-invert max-w-none pt-4">
									<ReactMarkdown>{lease.executedContentMarkdown}</ReactMarkdown>
								</div>
							</div>
						</div>
					)}
				</>
			) : (
				<p className="text-sm text-muted-foreground">
					No document available yet.
				</p>
			)}
		</SectionCard>
	)
}
