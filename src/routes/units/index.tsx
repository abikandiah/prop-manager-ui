import { createFileRoute } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { Button } from '@abumble/design-system/components/Button'
import { BannerHeader } from '@abumble/design-system/components/BannerHeader'
import {
	DialogTrigger,
	FormDialog,
} from '@abumble/design-system/components/Dialog'
import { UnitForm, UnitsGroupedView } from '@/features/units'
import { FORM_DIALOG_CLASS, useDialogState } from '@/lib/dialog'

export const Route = createFileRoute('/units/')({
	component: UnitsPage,
})

function UnitsPage() {
	const dialog = useDialogState()
	return (
		<div className="space-y-6">
			<BannerHeader
				title="Units"
				description="Manage all units across your properties. Add new units, update their status, or view details."
			/>

			<div>
				<FormDialog
					open={dialog.isOpen}
					onOpenChange={dialog.setIsOpen}
					title="Add unit"
					description="Select a property and enter the unit details."
					className={FORM_DIALOG_CLASS}
					trigger={
						<DialogTrigger asChild>
							<Button>
								<Plus className="size-4" />
								Add unit
							</Button>
						</DialogTrigger>
					}
				>
					<UnitForm
						onSuccess={dialog.close}
						onCancel={dialog.close}
						submitLabel="Create Unit"
					/>
				</FormDialog>
			</div>

			<UnitsGroupedView />
		</div>
	)
}
