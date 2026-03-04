import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/_org/_dashboard/messages/')({
	component: RouteComponent,
})

function RouteComponent() {
	return <div>Hello "/messages/"!</div>
}
