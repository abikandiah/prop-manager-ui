import { MessageBanner } from '@abumble/design-system/components/Banner'
import {
	Card,
	CardContent,
	CardHeader,
} from '@abumble/design-system/components/Card'
import { RegisterForm } from '@/components/RegisterForm'

export const Register = () => {
	return (
		<div className="flex flex-1 flex-col justify-center items-center px-4 py-8 gap-6">
			<MessageBanner
				type="warning"
				message="This is a development sandbox. This application is not intended for business or commercial use. No warranty, uptime guarantees, 
				or technical support are provided. Use at your own risk."
				className="w-full max-w-md rounded"
			/>

			<Card className="w-full max-w-md">
				<CardHeader className="space-y-1">
					<h1 className="text-2xl font-semibold text-foreground">
						Accept terms to continue
					</h1>
					<p className="text-sm text-muted-foreground">
						Please read and accept the Terms of Service and Privacy Policy
						before continuing.
					</p>
				</CardHeader>
				<CardContent>
					<RegisterForm />
				</CardContent>
			</Card>
		</div>
	)
}
