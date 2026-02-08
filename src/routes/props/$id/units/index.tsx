import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/props/$id/units/')({
	component: PropUnitsListPage,
})

function PropUnitsListPage() {
	return null
}
