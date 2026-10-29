import { clearStoredAccessToken } from '@/lib/app-params';
import { writeCache } from '@/lib/offline';

// Sign out without bouncing through another domain: forget the token and the
// cached profile on this device, then land on our own login page.
export function signOutLocally(to = '/login') {
  clearStoredAccessToken();
  writeCache('nook.me', null);
  window.location.assign(to);
}
