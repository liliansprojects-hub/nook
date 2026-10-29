const isNode = typeof window === 'undefined';

// The Base44 app this front end belongs to. The id is public (it already appears
// in every image URL); the env var lets you point a staging build somewhere else.
const DEFAULT_APP_ID = '6ad5f65588c4a5dd9c9935d0';
const TOKEN_KEYS = ['base44_access_token', 'token'];

const isClearAccessTokenRequested = () =>
	!isNode && new URLSearchParams(window.location.search).get("clear_access_token") === 'true';

const clearStoredAccessToken = () => {
	try {
		TOKEN_KEYS.forEach((key) => window.localStorage.removeItem(key));
	} catch {
		/* storage blocked */
	}
}

// Token from the sign-in redirect (?access_token=…) or from storage. A token in
// the URL is stored and then removed from the address bar.
const getAccessToken = () => {
	if (isNode) return null;
	try {
		const url = new URL(window.location.href);
		const fromUrl = url.searchParams.get('access_token');
		if (fromUrl) {
			window.localStorage.setItem('base44_access_token', fromUrl);
			url.searchParams.delete('access_token');
			window.history.replaceState({}, document.title, url.pathname + url.search + url.hash);
			return fromUrl;
		}
		return window.localStorage.getItem('base44_access_token') || window.localStorage.getItem('token') || null;
	} catch {
		return null;
	}
}

const getAppParams = () => {
	if (isClearAccessTokenRequested()) {
		clearStoredAccessToken();
	}
	return {
		appId: import.meta.env.VITE_BASE44_APP_ID || DEFAULT_APP_ID,
		token: getAccessToken(),
		functionsVersion: (!isNode && new URLSearchParams(window.location.search).get("functions_version")?.trim()) || import.meta.env.VITE_BASE44_FUNCTIONS_VERSION,
		appBaseUrl: import.meta.env.VITE_BASE44_APP_BASE_URL,
		// Served from Netlify, so the API is on Base44's own domain, not "same origin".
		serverUrl: import.meta.env.VITE_BASE44_SERVER_URL || 'https://base44.app',
	}
}

export const appParams = {
	...getAppParams()
}

export { clearStoredAccessToken };
