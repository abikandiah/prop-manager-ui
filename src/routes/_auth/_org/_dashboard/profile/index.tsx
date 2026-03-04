import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/_org/_dashboard/profile/')({
	component: RouteComponent,
})

function RouteComponent() {
	return <div>Hello "/profile/"!</div>
}
