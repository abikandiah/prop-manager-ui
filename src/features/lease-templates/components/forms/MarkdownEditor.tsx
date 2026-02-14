import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { cn } from '@abumble/design-system/utils'
import { Eye, Code } from 'lucide-react'
import { Label } from '@/components/ui/label'

export interface MarkdownEditorProps {
	value: string
	onChange: (value: string) => void
}

const PLACEHOLDERS = [
	{ key: 'property_name', desc: 'Property name' },
	{ key: 'unit_number', desc: 'Unit number' },
	{ key: 'start_date', desc: 'Lease start date' },
	{ key: 'end_date', desc: 'Lease end date' },
	{ key: 'rent_amount', desc: 'Monthly rent amount' },
	{ key: 'rent_due_day', desc: 'Day rent is due' },
	{ key: 'security_deposit', desc: 'Security deposit amount' },
	{ key: 'tenant_name', desc: 'Tenant full name' },
	{ key: 'landlord_name', desc: 'Landlord name' },
]

export function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
	const [viewMode, setViewMode] = useState<'split' | 'edit' | 'preview'>(
		'split',
	)

	const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		onChange(e.target.value)
	}

	const insertPlaceholder = (placeholder: string) => {
		const textarea = document.getElementById(
			'templateMarkdown',
		) as HTMLTextAreaElement
		if (!textarea) return

		const start = textarea.selectionStart
		const end = textarea.selectionEnd
		const text = value
		const before = text.substring(0, start)
		const after = text.substring(end)
		const newValue = `${before}{{${placeholder}}}${after}`

		onChange(newValue)

		// Set cursor position after the inserted placeholder
		setTimeout(() => {
			textarea.focus()
			textarea.setSelectionRange(
				start + placeholder.length + 4,
				start + placeholder.length + 4,
			)
		}, 0)
	}

	// Replace placeholders with example values for preview
	const getPreviewMarkdown = () => {
		return value
			.replace(/\{\{property_name\}\}/g, '**123 Main Street**')
			.replace(/\{\{unit_number\}\}/g, '**Unit 4B**')
			.replace(/\{\{start_date\}\}/g, '**January 1, 2026**')
			.replace(/\{\{end_date\}\}/g, '**December 31, 2026**')
			.replace(/\{\{rent_amount\}\}/g, '**$1,500**')
			.replace(/\{\{rent_due_day\}\}/g, '**1st**')
			.replace(/\{\{security_deposit\}\}/g, '**$1,500**')
			.replace(/\{\{tenant_name\}\}/g, '**John Smith**')
			.replace(/\{\{landlord_name\}\}/g, '**Jane Doe**')
	}

	return (
		<div className="space-y-4">
			{/* Header with view mode toggle */}
			<div className="flex items-center justify-between">
				<Label htmlFor="templateMarkdown">
					Template markdown{' '}
					<span className="text-destructive" aria-hidden>
						*
					</span>
				</Label>
				<div className="flex rounded-md border bg-muted/50">
					<button
						type="button"
						onClick={() => setViewMode('edit')}
						className={cn(
							'px-3 py-1.5 text-sm flex items-center gap-2 transition-colors rounded-l-md',
							viewMode === 'edit'
								? 'bg-background text-foreground shadow-sm'
								: 'text-muted-foreground hover:text-foreground',
						)}
					>
						<Code className="h-4 w-4" />
						Edit
					</button>
					<button
						type="button"
						onClick={() => setViewMode('split')}
						className={cn(
							'px-3 py-1.5 text-sm flex items-center gap-2 transition-colors border-x',
							viewMode === 'split'
								? 'bg-background text-foreground shadow-sm'
								: 'text-muted-foreground hover:text-foreground',
						)}
					>
						<Code className="h-4 w-4" />
						<Eye className="h-4 w-4" />
					</button>
					<button
						type="button"
						onClick={() => setViewMode('preview')}
						className={cn(
							'px-3 py-1.5 text-sm flex items-center gap-2 transition-colors rounded-r-md',
							viewMode === 'preview'
								? 'bg-background text-foreground shadow-sm'
								: 'text-muted-foreground hover:text-foreground',
						)}
					>
						<Eye className="h-4 w-4" />
						Preview
					</button>
				</div>
			</div>

			{/* Placeholders quick insert */}
			<div className="rounded-md border bg-muted/30 p-3">
				<p className="text-xs font-medium text-muted-foreground mb-2">
					Click to insert placeholder:
				</p>
				<div className="flex flex-wrap gap-1.5">
					{PLACEHOLDERS.map(({ key, desc }) => (
						<button
							key={key}
							type="button"
							onClick={() => insertPlaceholder(key)}
							className="inline-flex items-center rounded-md bg-background border px-2 py-1 text-xs font-mono hover:bg-accent hover:text-accent-foreground transition-colors"
							title={desc}
						>
							{'{{'}
							{key}
							{'}}'}
						</button>
					))}
				</div>
			</div>

			{/* Editor and Preview */}
			<div
				className={cn(
					'grid gap-4',
					viewMode === 'split' ? 'grid-cols-2' : 'grid-cols-1',
				)}
			>
				{/* Editor */}
				{(viewMode === 'edit' || viewMode === 'split') && (
					<div className="space-y-2">
						{viewMode === 'split' && (
							<p className="text-xs font-medium text-muted-foreground">
								Editor
							</p>
						)}
						<textarea
							id="templateMarkdown"
							value={value}
							onChange={handleTextareaChange}
							placeholder="Write your lease template in markdown...&#10;&#10;Example:&#10;# Lease Agreement&#10;&#10;This lease is between {{landlord_name}} and {{tenant_name}} for {{property_name}}, {{unit_number}}."
							required
							rows={viewMode === 'split' ? 20 : 24}
							className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono resize-none"
						/>
					</div>
				)}

				{/* Preview */}
				{(viewMode === 'preview' || viewMode === 'split') && (
					<div className="space-y-2">
						{viewMode === 'split' && (
							<p className="text-xs font-medium text-muted-foreground">
								Preview (with sample data)
							</p>
						)}
						<div
							className={cn(
								'rounded-md border border-input bg-background px-4 py-3 overflow-auto',
								viewMode === 'split' ? 'h-[520px]' : 'min-h-[600px]',
							)}
						>
							{value.trim() ? (
								<div className="prose prose-sm dark:prose-invert max-w-none">
									<ReactMarkdown>{getPreviewMarkdown()}</ReactMarkdown>
								</div>
							) : (
								<p className="text-sm text-muted-foreground italic">
									Preview will appear here as you type...
								</p>
							)}
						</div>
					</div>
				)}
			</div>

			<p className="text-xs text-muted-foreground">
				Use Markdown formatting for headings (#), lists (-), bold (**text**),
				and more.
			</p>
		</div>
	)
}
