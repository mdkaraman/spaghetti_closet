import { expect, test, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

vi.mock('@/lib/supabase/middleware', () => ({
  updateSession: vi.fn(),
}))

const { updateSession } = await import('@/lib/supabase/middleware')
const { middleware } = await import('../middleware')

function mockSession(siteWindow: 'live' | 'dark', user: { id: string } | null = null) {
  const response = NextResponse.next()
  response.headers.set('x-session', 'yes')
  vi.mocked(updateSession).mockResolvedValue({ response, user, siteWindow })
}

function request(pathname: string) {
  return new NextRequest(new URL(pathname, 'http://localhost'))
}

test('live stub does not redirect a public page', async () => {
  mockSession('live')
  const response = await middleware(request('/wtf-is-this'))
  expect(response.headers.get('location')).toBeNull()
  expect(response.headers.get('x-session')).toBe('yes')
})

test('live stub sends a logged-out visitor to login, not the waitlist', async () => {
  mockSession('live')
  for (const pathname of ['/jont', '/chat', '/bid', '/sell']) {
    const response = await middleware(request(pathname))
    const location = new URL(response.headers.get('location') ?? '')
    expect(location.origin).toBe('http://localhost')
    expect(location.pathname).toBe('/')
    expect(location.searchParams.get('next')).toBe(pathname)
    expect(location.pathname).not.toBe('/waitlist')
  }
})

test('live window lets a logged-in visitor through to a protected page', async () => {
  mockSession('live', { id: 'user-1' })
  const response = await middleware(request('/pay'))
  expect(response.headers.get('location')).toBeNull()
  expect(response.headers.get('x-session')).toBe('yes')
})

test('dark window redirects everything else to the waitlist', async () => {
  mockSession('dark', { id: 'user-1' })
  for (const pathname of ['/jont', '/user', '/pay', '/chat', '/bid', '/sell']) {
    const response = await middleware(request(pathname))
    expect(response.headers.get('location')).toBe('http://localhost/waitlist')
  }
})

test('dark window still loads the allowlist', async () => {
  mockSession('dark')
  for (const pathname of [
    '/',
    '/wtf-is-this',
    '/signup',
    '/signup/complete',
    '/forgot-password',
    '/reset-password',
    '/reset-password/expired',
    '/auth/callback',
    '/waitlist',
  ]) {
    const response = await middleware(request(pathname))
    expect(response.headers.get('location')).toBeNull()
    expect(response.headers.get('x-session')).toBe('yes')
  }
})
