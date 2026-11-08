import { base44 } from '@/api/base44Client';
import { readCache, writeCache } from '@/lib/offline';

// Log in with a username. The username -> email link is kept on this device after
// the first sign-in or sign-up, and looked up in the account records when they can be read.
const KEY = 'nook.usernames';
const clean = (v) => String(v || '').trim().toLowerCase();

const readMap = () => readCache(KEY) || {};

export function rememberLogin(username, email) {
  const name = clean(username);
  if (!name || name.includes('@') || !email) return;
  writeCache(KEY, { ...readMap(), [name]: clean(email) });
}

// Returns the email to sign in with, or "" when the username is unknown.
export async function resolveEmail(identifier) {
  const value = clean(identifier);
  if (!value) return '';
  if (value.includes('@')) return value; // an email still works in the same box
  const known = readMap()[value];
  if (known) return known;
  try {
    const found = await base44.entities.Username.filter({ username: value }, { limit: 1 });
    const rows = Array.isArray(found) ? found : found?.items || [];
    if (rows[0]?.email) return clean(rows[0].email);
  } catch {
    /* records not readable before signing in */
  }
  return '';
}
