import { MessageBanner } from '@abumble/design-system/components/Banner'
import { stringToBoolean } from '@abumble/design-system/utils'
import { useState } from 'react'

const DISCLAIMER_KEY = 'prop_mange_disclaimer_dismissed'

export function EnvironmentBanner() {
	const [dismissed, setDismissed] = useState(
		stringToBoolean(localStorage.getItem(DISCLAIMER_KEY)),
	)

	if (dismissed) return null

	function onDismiss() {
		localStorage.setItem(DISCLAIMER_KEY, true.toString())
		setDismissed(true)
	}

	return (
		<MessageBanner
			type="info"
			message="This is a sandbox environment. It is not intended for business or commercial use. No warranty, uptime guarantees, or technical support are provided."
			className="rounded-none"
			onClose={onDismiss}
			hideIcon
		/>
	)
}
