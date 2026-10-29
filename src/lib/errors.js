// Pulls the most useful message out of an SDK / axios / fetch error.
export function errMessage(err, fallback = 'Something went wrong') {
  const body = err?.data ?? err?.response?.data;
  const fromBody = typeof body === 'string' ? body : body?.error || body?.message || body?.detail;
  const msg = fromBody || err?.message;
  if (!msg || /^Request failed with status code/i.test(msg)) return fallback;
  return msg;
}

export function errStatus(err) {
  return err?.status ?? err?.response?.status ?? null;
}

// the request never got an answer: offline, blocked, DNS
export function isNetworkError(err) {
  if (errStatus(err)) return false;
  return typeof navigator !== 'undefined' && !navigator.onLine
    ? true
    : err?.name === 'TypeError' || /network|failed to fetch/i.test(err?.message || '');
}
