// Netlify can inject a "Powered by Netlify" badge or its toolbar into the page.
// This keeps any of them out of sight. (Hosting settings can also switch it off:
// Netlify > Site configuration > Build & deploy > Post processing.)
const SELECTOR = [
  'netlify-drawer',
  '#netlify-drawer',
  '#netlify-badge',
  '[id^="netlify-"]',
  '[class*="netlify-badge"]',
  'iframe[src*="netlify"]',
  'a[href*="netlify.com"]',
].join(',');

function sweep(root = document) {
  root.querySelectorAll?.(SELECTOR).forEach((el) => {
    if (el.closest('#root') && !el.matches('a[href*="netlify.com"]')) return;
    el.remove();
  });
}

export function hideNetlifyBadge() {
  if (typeof document === 'undefined') return;
  sweep();
  new MutationObserver(() => sweep()).observe(document.documentElement, { childList: true, subtree: true });
}
