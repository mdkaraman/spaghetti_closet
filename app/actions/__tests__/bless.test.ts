import { expect, test, vi } from 'vitest'
import { bless } from '../bless'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

const { createClient } = await import('@/lib/supabase/server')

function formData(fields: { handle?: string; amount?: string }) {
  const fd = new FormData()
  if (fields.handle !== undefined) fd.set('handle', fields.handle)
  if (fields.amount !== undefined) fd.set('amount', fields.amount)
  return fd
}

function mockClient({
  user = { id: 'user-1' } as { id: string } | null,
  handle = 'me',
  error = null as { message: string } | null,
} = {}) {
  const single = vi.fn(async () => ({ data: { user_id: handle }, error: null }))
  const eq = vi.fn(() => ({ single }))
  const select = vi.fn(() => ({ eq }))
  const from = vi.fn((table: string) => {
    if (table !== 'profiles') throw new Error(`unexpected table ${table}`)
    return { select }
  })
  const rpc = vi.fn().mockResolvedValue({ data: null, error })
  vi.mocked(createClient).mockResolvedValue({
    auth: {
      getUser: () => Promise.resolve({ data: { user }, error: null }),
    },
    from,
    rpc,
  } as never)
  return { from, select, eq, rpc }
}

test('an empty handle does not call bless_spaghetti', async () => {
  const { from, rpc } = mockClient()

  await expect(bless(formData({ handle: '', amount: '1' }))).rejects.toThrow(
    'NEXT_REDIRECT:/user?error=' + encodeURIComponent('who you blessing')
  )
  await expect(bless(formData({ amount: '1' }))).rejects.toThrow(
    'NEXT_REDIRECT:/user?error=' + encodeURIComponent('who you blessing')
  )
  await expect(bless(formData({ handle: '   ', amount: '1' }))).rejects.toThrow(
    'NEXT_REDIRECT:/user?error=' + encodeURIComponent('who you blessing')
  )

  expect(from).not.toHaveBeenCalled()
  expect(rpc).not.toHaveBeenCalled()
})

test('a gift to yourself does not call bless_spaghetti', async () => {
  const { eq, rpc } = mockClient({ handle: 'me' })

  await expect(bless(formData({ handle: 'me', amount: '1' }))).rejects.toThrow(
    'NEXT_REDIRECT:/user?error=' + encodeURIComponent('cannot bless yourself')
  )
  await expect(bless(formData({ handle: '  me  ', amount: '1' }))).rejects.toThrow(
    'NEXT_REDIRECT:/user?error=' + encodeURIComponent('cannot bless yourself')
  )

  expect(eq).toHaveBeenCalledWith('id', 'user-1')
  expect(rpc).not.toHaveBeenCalled()
})

test('an amount under 1 does not call bless_spaghetti', async () => {
  const { from, rpc } = mockClient()

  await expect(bless(formData({ handle: 'ada', amount: '0' }))).rejects.toThrow(
    'NEXT_REDIRECT:/user?error=' + encodeURIComponent('whole number, 1 minimum')
  )
  await expect(bless(formData({ handle: 'ada', amount: '-1' }))).rejects.toThrow(
    'NEXT_REDIRECT:/user?error=' + encodeURIComponent('whole number, 1 minimum')
  )
  await expect(bless(formData({ handle: 'ada', amount: '1.5' }))).rejects.toThrow(
    'NEXT_REDIRECT:/user?error=' + encodeURIComponent('whole number, 1 minimum')
  )
  await expect(bless(formData({ handle: 'ada', amount: '' }))).rejects.toThrow(
    'NEXT_REDIRECT:/user?error=' + encodeURIComponent('whole number, 1 minimum')
  )

  expect(from).not.toHaveBeenCalled()
  expect(rpc).not.toHaveBeenCalled()
})

test('a good gift calls bless_spaghetti with the handle and amount', async () => {
  const { rpc } = mockClient({ handle: 'me' })

  await expect(bless(formData({ handle: 'ada', amount: '3' }))).rejects.toThrow(
    'NEXT_REDIRECT:/user'
  )

  expect(rpc).toHaveBeenCalledWith('bless_spaghetti', {
    recipient_handle: 'ada',
    amount: 3,
  })
})

test('logged-out bless redirects home and does not call the rpc', async () => {
  const { from, rpc } = mockClient({ user: null })

  await expect(bless(formData({ handle: 'ada', amount: '1' }))).rejects.toThrow(
    'NEXT_REDIRECT:/'
  )

  expect(from).not.toHaveBeenCalled()
  expect(rpc).not.toHaveBeenCalled()
})

test('a failed bless_spaghetti redirects with the error', async () => {
  mockClient({ error: { message: 'amount greater than balance' } })

  await expect(bless(formData({ handle: 'ada', amount: '4' }))).rejects.toThrow(
    'NEXT_REDIRECT:/user?error=' + encodeURIComponent('amount greater than balance')
  )
})
