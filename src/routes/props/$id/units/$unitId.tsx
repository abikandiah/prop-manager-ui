import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/props/$id/units/$unitId')({
	beforeLoad: ({ params }) => {
		throw redirect({
			to: '/props/$id',
			params: { id: params.id },
			search: { unit: params.unitId },
		})
	},
	component: UnitDetailPage,
})

function UnitDetailPage() {
	return null
}
