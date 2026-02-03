import { expect, test, vi } from 'vitest'
import { login } from '../auth'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

const { createClient } = await import('@/lib/supabase/server')

function formData(overrides: { userid?: string; passcode?: string } = {}) {
  const fd = new FormData()
  if (overrides.userid !== undefined) fd.set('userid', overrides.userid)
  if (overrides.passcode !== undefined) fd.set('passcode', overrides.passcode)
  return fd
}

test('login with missing user id redirects to wtf-is-this', async () => {
  const fd = formData({ passcode: 'secret123' })
  await expect(login(fd)).rejects.toThrow('NEXT_REDIRECT:/wtf-is-this')
})

test('login with missing passcode redirects to wtf-is-this', async () => {
  const fd = formData({ userid: 'myhandle' })
  await expect(login(fd)).rejects.toThrow('NEXT_REDIRECT:/wtf-is-this')
})

test('login with empty user id and passcode redirects to wtf-is-this', async () => {
  const fd = formData({ userid: '', passcode: '' })
  await expect(login(fd)).rejects.toThrow('NEXT_REDIRECT:/wtf-is-this')
})

test('login when profile not found redirects to wtf-is-this', async () => {
  vi.mocked(createClient).mockResolvedValue({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    }),
    auth: {},
  } as any)
  const fd = formData({ userid: 'nobody', passcode: 'secret123' })
  await expect(login(fd)).rejects.toThrow('NEXT_REDIRECT:/wtf-is-this')
})

test('login when signInWithPassword fails redirects to wtf-is-this', async () => {
  vi.mocked(createClient).mockResolvedValue({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({ data: { email: 'user@example.com' }, error: null }),
        }),
      }),
    }),
    auth: {
      signInWithPassword: () =>
        Promise.resolve({ data: { user: null, session: null }, error: { message: 'Invalid login' } }),
    },
  } as any)
  const fd = formData({ userid: 'myhandle', passcode: 'wrongpass' })
  await expect(login(fd)).rejects.toThrow('NEXT_REDIRECT:/wtf-is-this')
})
