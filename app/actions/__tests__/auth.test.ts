import { expect, test, vi } from 'vitest'
import { login, signup, completeSignup } from '../auth'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
  createServiceRoleClient: vi.fn(),
}))

const { createClient, createServiceRoleClient } = await import('@/lib/supabase/server')

function formData(overrides: { userid?: string; passcode?: string } = {}) {
  const fd = new FormData()
  if (overrides.userid !== undefined) fd.set('userid', overrides.userid)
  if (overrides.passcode !== undefined) fd.set('passcode', overrides.passcode)
  return fd
}

function signupFormData(overrides: {
  userid?: string
  email?: string
  passcode?: string
  confirm?: string
} = {}) {
  const fd = new FormData()
  if (overrides.userid !== undefined) fd.set('userid', overrides.userid)
  if (overrides.email !== undefined) fd.set('email', overrides.email)
  if (overrides.passcode !== undefined) fd.set('passcode', overrides.passcode)
  if (overrides.confirm !== undefined) fd.set('confirm', overrides.confirm)
  return fd
}

test('login with missing user id redirects to home with error', async () => {
  const fd = formData({ passcode: 'secret123' })
  await expect(login(fd)).rejects.toThrow(/NEXT_REDIRECT:\/\?error=.*nah/)
})

test('login with missing passcode redirects to home with error', async () => {
  const fd = formData({ userid: 'myhandle' })
  await expect(login(fd)).rejects.toThrow(/NEXT_REDIRECT:\/\?error=.*nah/)
})

test('login with empty user id and passcode redirects to home with error', async () => {
  const fd = formData({ userid: '', passcode: '' })
  await expect(login(fd)).rejects.toThrow(/NEXT_REDIRECT:\/\?error=.*nah/)
})

test('login when profile not found redirects to home with error', async () => {
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
  await expect(login(fd)).rejects.toThrow(/NEXT_REDIRECT:\/\?error=.*nah/)
})

test('login when signInWithPassword fails redirects to home with error', async () => {
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
  await expect(login(fd)).rejects.toThrow(/NEXT_REDIRECT:\/\?error=.*nah/)
})

// --- signup validation ---

test('signup with missing fields redirects with error', async () => {
  const fd = signupFormData({ email: 'a@b.co', passcode: 'secret12', confirm: 'secret12' })
  await expect(signup(fd)).rejects.toThrow('NEXT_REDIRECT:/signup?error=')
})

test('signup when passcode and confirm do not match redirects with error', async () => {
  const fd = signupFormData({
    userid: 'handle',
    email: 'a@b.co',
    passcode: 'secret12',
    confirm: 'other12',
  })
  await expect(signup(fd)).rejects.toThrow(/NEXT_REDIRECT:\/signup\?error=.*matchy/)
})

test('signup when passcode too short redirects with error', async () => {
  const fd = signupFormData({
    userid: 'handle',
    email: 'a@b.co',
    passcode: '12345',
    confirm: '12345',
  })
  await expect(signup(fd)).rejects.toThrow(/NEXT_REDIRECT:\/signup\?error=.*6.*characters/)
})

test('signup when user id already taken redirects with error', async () => {
  vi.mocked(createClient).mockResolvedValue({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: { id: 'existing-id' }, error: null }),
        }),
      }),
    }),
    auth: {},
  } as any)
  const fd = signupFormData({
    userid: 'taken',
    email: 'a@b.co',
    passcode: 'secret12',
    confirm: 'secret12',
  })
  await expect(signup(fd)).rejects.toThrow(/NEXT_REDIRECT:\/signup\?error=.*already.*taken/)
})

test('signup when no service key redirects to complete with userid', async () => {
  vi.mocked(createClient).mockResolvedValue({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    }),
    auth: {
      signUp: () =>
        Promise.resolve({
          data: { user: { id: 'user-1', email: 'a@b.co' }, session: {} },
          error: null,
        }),
    },
  } as any)
  vi.mocked(createServiceRoleClient).mockImplementation(() => {
    throw new Error('Missing env')
  })
  const fd = signupFormData({
    userid: 'myhandle',
    email: 'a@b.co',
    passcode: 'secret12',
    confirm: 'secret12',
  })
  await expect(signup(fd)).rejects.toThrow('NEXT_REDIRECT:/signup/complete?userid=myhandle')
})

// --- completeSignup ---

test('completeSignup when no session redirects to signup with error', async () => {
  vi.mocked(createClient).mockResolvedValue({
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    },
  } as any)
  await expect(completeSignup('myhandle')).rejects.toThrow(/slept.*sign.*again/)
})

test('completeSignup when empty userid redirects to signup', async () => {
  vi.mocked(createClient).mockResolvedValue({
    auth: {
      getUser: () =>
        Promise.resolve({ data: { user: { id: 'u1', email: 'a@b.co' } }, error: null }),
    },
  } as any)
  await expect(completeSignup('')).rejects.toThrow('NEXT_REDIRECT:/signup')
})
