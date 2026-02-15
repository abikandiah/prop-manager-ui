import { memo, useCallback, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { cn } from '@abumble/design-system/utils'
import { Code, Eye } from 'lucide-react'
import { Label } from '@abumble/design-system/components/Label'
import { ALL_BUILTIN_PARAMETERS, PREVIEW_VALUES } from '../../constants'

export interface MarkdownEditorProps {
	value: string
	onChange: (value: string) => void
	customParameters?: Record<string, string>
}

const MarkdownPreviewContent = memo(function MarkdownPreviewContent({
	markdown,
	empty,
}: {
	markdown: string
	empty: boolean
}) {
	if (empty) {
		return (
			<p className="text-sm text-muted-foreground italic">
				Preview will appear here as you type...
			</p>
		)
	}
	return (
		<div className="prose prose-sm dark:prose-invert max-w-none">
			<ReactMarkdown>{markdown}</ReactMarkdown>
		</div>
	)
})

const PlaceholderButtons = memo(function PlaceholderButtons({
	onInsert,
	customParameters = {},
}: {
	onInsert: (key: string) => void
	customParameters?: Record<string, string>
}) {
	const customKeys = Object.keys(customParameters).filter(
		(key) => !ALL_BUILTIN_PARAMETERS.some((p) => p.key === key),
	)
	const hasCustomParams = customKeys.length > 0

	return (
		<div className="rounded-md border bg-muted/30 p-3 space-y-3">
			{/* Built-in Parameters */}
			<div>
				<p className="text-xs font-medium text-muted-foreground mb-2">
					Click to insert placeholder:
				</p>
				<div className="flex flex-wrap gap-1.5">
					{ALL_BUILTIN_PARAMETERS.map(({ key, description }) => (
						<button
							key={key}
							type="button"
							onClick={() => onInsert(key)}
							className="inline-flex items-center rounded-md bg-background border px-2 py-1 text-xs font-mono hover:bg-accent hover:text-accent-foreground transition-colors"
							title={description}
						>
							{'{{'}
							{key}
							{'}}'}
						</button>
					))}
				</div>
			</div>

			{/* Custom Parameters */}
			{hasCustomParams && (
				<div>
					<p className="text-xs font-medium text-muted-foreground mb-2">
						Custom parameters:
					</p>
					<div className="flex flex-wrap gap-1.5">
						{customKeys.map((key) => (
							<button
								key={key}
								type="button"
								onClick={() => onInsert(key)}
								className="inline-flex items-center rounded-md bg-background border border-primary/50 px-2 py-1 text-xs font-mono hover:bg-accent hover:text-accent-foreground transition-colors"
								title={`Custom: ${customParameters[key] || 'No default value'}`}
							>
								{'{{'}
								{key}
								{'}}'}
							</button>
						))}
					</div>
				</div>
			)}
		</div>
	)
})

const ViewModeToggle = memo(function ViewModeToggle({
	viewMode,
	onModeChange,
}: {
	viewMode: 'split' | 'edit' | 'preview'
	onModeChange: (mode: 'split' | 'edit' | 'preview') => void
}) {
	return (
		<div className="flex rounded-md border bg-muted/50">
			<button
				type="button"
				onClick={() => onModeChange('edit')}
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
				onClick={() => onModeChange('split')}
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
				onClick={() => onModeChange('preview')}
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
	)
})

const MarkdownEditorComponent = function MarkdownEditor({
	value,
	onChange,
	customParameters = {},
}: MarkdownEditorProps) {
	const [viewMode, setViewMode] = useState<'split' | 'edit' | 'preview'>(
		'split',
	)
	const textareaRef = useRef<HTMLTextAreaElement>(null)

	const handleTextareaChange = useCallback(
		(e: React.ChangeEvent<HTMLTextAreaElement>) => {
			onChange(e.target.value)
		},
		[onChange],
	)

	const handleViewModeChange = useCallback(
		(mode: 'split' | 'edit' | 'preview') => {
			setViewMode(mode)
		},
		[],
	)

	const insertPlaceholder = useCallback(
		(placeholder: string) => {
			const textarea = textareaRef.current
			if (!textarea) return

			const start = textarea.selectionStart
			const end = textarea.selectionEnd
			const currentValue = textarea.value
			const before = currentValue.substring(0, start)
			const after = currentValue.substring(end)
			const newValue = `${before}{{${placeholder}}}${after}`

			onChange(newValue)

			// Set cursor after inserted placeholder (after React re-render)
			const newCursor = start + placeholder.length + 4
			setTimeout(() => {
				textarea.focus()
				textarea.setSelectionRange(newCursor, newCursor)
			}, 0)
		},
		[onChange],
	)

	// Combine system preview values with custom parameter values
	const allPreviewValues = useMemo(() => {
		const customPreviewValues: Record<string, string> = {}
		Object.entries(customParameters).forEach(([key, value]) => {
			// Wrap custom values in bold markdown for preview
			customPreviewValues[key] = value ? `**${value}**` : `**[${key}]**`
		})
		return { ...PREVIEW_VALUES, ...customPreviewValues }
	}, [customParameters])

	const previewMarkdown = useMemo(
		() =>
			value.replace(
				/\{\{(\w+)\}\}/g,
				(_, key) => allPreviewValues[key] ?? `{{${key}}}`,
			),
		[value, allPreviewValues],
	)

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
				<ViewModeToggle
					viewMode={viewMode}
					onModeChange={handleViewModeChange}
				/>
			</div>

			{/* Placeholders quick insert */}
			<PlaceholderButtons
				onInsert={insertPlaceholder}
				customParameters={customParameters}
			/>

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
						<p className="text-xs font-medium text-muted-foreground">Editor</p>
						<textarea
							ref={textareaRef}
							id="templateMarkdown"
							value={value}
							onChange={handleTextareaChange}
							placeholder="Write your lease template in markdown...&#10;&#10;Example:&#10;# Lease Agreement&#10;&#10;This lease is between {{landlord_name}} and {{tenant_name}} for {{property_name}}, {{unit_number}}."
							required
							className={cn(
								`flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none 
								focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono resize-none`,
								'min-h-[600px]',
							)}
						/>
					</div>
				)}

				{/* Preview */}
				{(viewMode === 'preview' || viewMode === 'split') && (
					<div className="space-y-2">
						<p className="text-xs font-medium text-muted-foreground">
							Preview (with sample data)
						</p>
						<div
							className={cn(
								'rounded-md border border-input bg-background px-4 py-3 overflow-auto',
								'min-h-[600px]',
							)}
						>
							<MarkdownPreviewContent
								markdown={previewMarkdown}
								empty={!value.trim()}
							/>
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

export const MarkdownEditor = memo(MarkdownEditorComponent)
