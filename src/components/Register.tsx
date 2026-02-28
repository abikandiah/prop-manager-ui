import { MessageBanner } from '@abumble/design-system/components/Banner'
import { RegisterForm } from '@/components/RegisterForm'

export const Register = () => {
	return (
		<div className="flex min-h-[60vh] flex-col items-center justify-center gap-8">
			<MessageBanner
				type="info"
				message="This is a sandbox environment. This application is not intended for business or commercial use. No warranty, uptime guarantees, 
				or technical support are provided. Use at your own risk."
				className="w-full max-w-md rounded"
			/>

			<RegisterForm />
		</div>
	)
}
