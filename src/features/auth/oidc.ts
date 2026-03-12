import { config } from '@/config'
import { UserManager, WebStorageStateStore } from 'oidc-client-ts'

// Only instantiated when an OIDC authority is configured (production).
// In dev, config.oidcAuthority is '' so this stays null.
export const oidcManager = config.oidcAuthority
	? new UserManager({
			authority: config.oidcAuthority,
			client_id: config.oidcClientId,
			redirect_uri: config.oidcRedirectUri,
			scope: 'openid profile email offline_access',
			response_type: 'code',
			automaticSilentRenew: true,
			userStore: new WebStorageStateStore({ store: window.localStorage }),
		})
	: null
