import { expect, test, vi } from 'vitest'
import { requestPasswordReset } from '../forgot-password'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

const { createClient } = await import('@/lib/supabase/server')

function formData(email?: string) {
  const fd = new FormData()
  if (email !== undefined) fd.set('email', email)
  return fd
}

test('rate limit error uses wait copy', async () => {
  vi.mocked(createClient).mockResolvedValue({
    auth: {
      resetPasswordForEmail: () =>
        Promise.resolve({
          data: {},
          error: {
            message: 'For security purposes, you can only request this after 28 seconds.',
          },
        }),
    },
  } as any)

  await expect(requestPasswordReset(formData('a@b.co'))).rejects.toThrow(
    'NEXT_REDIRECT:/forgot-password?error=' +
      encodeURIComponent('nahhh playa gotta wait a min and try again')
  )
})

test('other reset errors keep the supabase message', async () => {
  vi.mocked(createClient).mockResolvedValue({
    auth: {
      resetPasswordForEmail: () =>
        Promise.resolve({
          data: {},
          error: { message: 'Unable to send email' },
        }),
    },
  } as any)

  await expect(requestPasswordReset(formData('a@b.co'))).rejects.toThrow(
    'NEXT_REDIRECT:/forgot-password?error=' + encodeURIComponent('Unable to send email')
  )
})
