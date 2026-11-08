import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';

// "Continue with Google" opens Base44's own sign-in page (it has the Google button),
// then comes straight back here already signed in. This uses the SDK's own redirect
// rather than a hand-made /api address, which is what showed the raw error text.
export const GOOGLE_ENABLED = import.meta.env.VITE_DISABLE_GOOGLE_LOGIN !== 'true';

export function startGoogleLogin(returnTo = '/') {
  const back = new URL(returnTo, window.location.origin).toString();
  if (typeof base44.auth.redirectToLogin === 'function') {
    base44.auth.redirectToLogin(back);
    return;
  }
  const host = String(appParams.serverUrl).replace(/\/+$/, '');
  window.location.assign(`${host}/login?from_url=${encodeURIComponent(back)}&app_id=${encodeURIComponent(appParams.appId)}`);
}
