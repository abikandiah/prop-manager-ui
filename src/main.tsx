import { ThemeProvider } from '@abumble/design-system/themes'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from './components/ErrorBoundary'
import { NetworkProvider } from './contexts/network.tsx'
import { globalClient } from './integrations/tanstack-query/globalClient.ts'
import { router } from './integrations/tanstack-query/router.tsx'
import reportWebVitals from './reportWebVitals'
import './styles.css'

// Render the app
const rootElement = document.getElementById('app')
if (rootElement && !rootElement.innerHTML) {
	const root = createRoot(rootElement)
	root.render(
		<StrictMode>
			<ErrorBoundary>
				<QueryClientProvider client={globalClient}>
					<NetworkProvider>
						<ThemeProvider defaultColorTheme="steel">
							<RouterProvider
								router={router}
								context={{
									globalClient: globalClient,
								}}
							/>
						</ThemeProvider>
					</NetworkProvider>
				</QueryClientProvider>
			</ErrorBoundary>
		</StrictMode>,
	)
}

reportWebVitals()
