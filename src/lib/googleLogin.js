import { appParams } from '@/lib/app-params';

// The SDK's own loginWithProvider() redirects to a relative /api/... path, which
// does not exist on Netlify (that was the 404). This sends the browser to Base44's
// sign-in endpoint directly and asks it to come back to this site afterwards.
// Override the host with VITE_BASE44_AUTH_URL if Base44 gives you a different one.
export function startGoogleLogin(returnTo = '/') {
  const back = new URL(returnTo, window.location.origin).toString();
  const host = String(import.meta.env.VITE_BASE44_AUTH_URL || appParams.serverUrl).replace(/\/+$/, '');
  window.location.assign(`${host}/api/apps/auth/login?app_id=${encodeURIComponent(appParams.appId)}&from_url=${encodeURIComponent(back)}`);
}
