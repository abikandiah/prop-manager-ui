import { useState } from 'react'
import { Button } from '@abumble/design-system/components/Button'
import { Input } from '@abumble/design-system/components/Input'
import { toast } from 'sonner'
import { useCreateProp } from '@/features/props/hooks'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export function PropsForm() {
	const createProp = useCreateProp()
	const [isDialogOpen, setIsDialogOpen] = useState(false)
	const [name, setName] = useState('')
	const [description, setDescription] = useState('')

	const handleCreate = (e: React.FormEvent) => {
		e.preventDefault()
		if (!name.trim()) return

		createProp.mutate(
			{
				name: name.trim(),
				description: description.trim() || null,
			},
			{
				onSuccess: () => {
					setName('')
					setDescription('')
					setIsDialogOpen(false)
					toast.success('Property created successfully')
				},
				onError: (err) => {
					toast.error(`Failed to create property: ${err.message}`)
				},
			},
		)
	}

	return (
		<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
			<DialogTrigger asChild>
				<Button size="lg">Add property</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Add new property</DialogTitle>
					<DialogDescription>
						Fill in the details for the new property you want to manage.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleCreate} className="space-y-4 py-4">
					<div className="space-y-2">
						<Label htmlFor="name">Name</Label>
						<Input
							id="name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="e.g. Sunny Apartments"
							required
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="description">Description</Label>
						<Textarea
							id="description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Optional property details..."
							rows={3}
						/>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							type="button"
							onClick={() => setIsDialogOpen(false)}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={createProp.isPending}>
							{createProp.isPending ? 'Creating…' : 'Create Property'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}
