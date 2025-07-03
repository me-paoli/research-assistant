/*
  Returns the canonical site URL.
  – Prefers NEXT_PUBLIC_SITE_URL (set in Vercel for prod).
  – Falls back to window.location.origin in the browser.
  – Strips any trailing slash so you can safely append paths.
*/
export const getSiteUrl = (): string =>
  (process.env.NEXT_PUBLIC_SITE_URL ||
   (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'))
    .replace(/\/+$/, ''); 