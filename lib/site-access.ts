const DARK_ALLOWED = new Set([
  '/',
  '/wtf-is-this',
  '/signup',
  '/signup/complete',
  '/forgot-password',
  '/reset-password',
  '/reset-password/expired',
  '/auth/callback',
  '/waitlist',
])

export function darkAllows(pathname: string): boolean {
  return DARK_ALLOWED.has(pathname)
}
