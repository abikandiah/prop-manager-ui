import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/props/$id/')({
	component: PropUnitsIndexPage,
})

function PropUnitsIndexPage() {
	return null
}
