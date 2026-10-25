import { expect, test } from 'vitest'
import { darkAllows } from '@/lib/site-access'

const allowed = [
  '/',
  '/wtf-is-this',
  '/signup',
  '/signup/complete',
  '/forgot-password',
  '/reset-password',
  '/reset-password/expired',
  '/auth/callback',
  '/waitlist',
]

test('dark allowlist keeps auth, signup, and waitlist paths', () => {
  for (const pathname of allowed) {
    expect(darkAllows(pathname)).toBe(true)
  }
})

test('dark allowlist rejects the rest of the site', () => {
  for (const pathname of ['/jont', '/user', '/pay', '/chat', '/bid', '/sell', '/signup/extra']) {
    expect(darkAllows(pathname)).toBe(false)
  }
})
