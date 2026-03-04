import { config } from '@/config'
import { useNetwork } from '@/contexts/network'
import { MessageBanner } from '@abumble/design-system/components/Banner'
import { cn } from '@abumble/design-system/utils'
import { ServerOff, WifiOff } from 'lucide-react'

export function OfflineWarningBanner() {
	const { isOnline, isServerReachable, consecutiveFailures } = useNetwork()
	if (isOnline) {
		return null
	}

	return (
		<MessageBanner
			type="warning"
			hideIcon
			message={
				<span className="flex flex-col gap-1">
					<span className="flex items-center gap-2">
						{isServerReachable ? (
							<>
								<WifiOff className="size-4 shrink-0" aria-hidden />
								<span>
									You're offline. Changes will sync when you're back online.
								</span>
							</>
						) : (
							<>
								<ServerOff className="size-4 shrink-0" aria-hidden />
								<span>
									Server unavailable. Changes will sync when the server is back
									online.
								</span>
							</>
						)}
					</span>
					{config.isDevelopment && consecutiveFailures > 0 && (
						<span className="text-xs opacity-75">
							Debug: {consecutiveFailures} consecutive failures
						</span>
					)}
				</span>
			}
			className={cn('mb-4 md:-mt-2')}
		/>
	)
}
