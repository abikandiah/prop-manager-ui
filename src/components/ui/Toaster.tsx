import { Toaster as DesignSystemToaster } from '@abumble/design-system/components/Toaster'
import { useTheme } from '@/contexts/theme'

type ToasterProps = React.ComponentProps<typeof DesignSystemToaster>

export function Toaster(props: ToasterProps) {
	const { theme } = useTheme()
	return (
		<DesignSystemToaster
			theme={theme as 'light' | 'dark' | 'system'}
			{...props}
		/>
	)
}
