import { config } from '@/config'
import { UserManager, WebStorageStateStore } from 'oidc-client-ts'

// Only instantiated when an OIDC authority is configured
export const oidcManager = config.oidcAuthority
	? new UserManager({
			authority: config.oidcAuthority,
			client_id: config.oidcClientId,
			redirect_uri: config.oidcRedirectUri,
			// Used as iframe fallback when no refresh token is available
			silent_redirect_uri: `${window.location.origin}/auth/silent-callback`,
			scope: `openid profile email offline_access${
				config.oidcResource ? ` ${config.oidcResource}/access` : ''
			}`,
			resource: config.oidcResource || undefined,
			extraTokenParams: config.oidcResource
				? { resource: config.oidcResource }
				: {},
			response_type: 'code',
			automaticSilentRenew: true,
			userStore: new WebStorageStateStore({ store: window.localStorage }),
		})
	: null
