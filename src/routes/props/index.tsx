import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { Button } from '@abumble/design-system/components/Button'
import { BannerHeader } from '@abumble/design-system/components/BannerHeader'
import {
	DialogTrigger,
	FormDialog,
} from '@abumble/design-system/components/Dialog'
import { PropsForm, PropsTableView } from '@/features/props'
import { FORM_DIALOG_CLASS, useDialogState } from '@/lib/dialog'

export const Route = createFileRoute('/props/')({
	component: RouteComponent,
})

function RouteComponent() {
	const navigate = useNavigate()
	const dialog = useDialogState()
	return (
		<>
			<BannerHeader
				title="Properties"
				description={
					<>
						This is where you keep a list of every property you own or
						manage—your house, a rental building, a commercial space, or a piece
						of land. Add each one with its address and a few details; later you
						can attach units and tenants to them.
					</>
				}
			/>

			<div>
				<FormDialog
					open={dialog.isOpen}
					onOpenChange={dialog.setIsOpen}
					title="Add property"
					description="Enter the legal name, address, and property details."
					className={FORM_DIALOG_CLASS}
					trigger={
						<DialogTrigger asChild>
							<Button>
								<Plus className="size-4" />
								Add property
							</Button>
						</DialogTrigger>
					}
				>
					<PropsForm
						onSuccess={(data) => {
							dialog.close()
							if (data) navigate({ to: '/props/$id', params: { id: data.id } })
						}}
						onCancel={dialog.close}
						submitLabel="Create Property"
					/>
				</FormDialog>
			</div>

			<PropsTableView />
		</>
	)
}
