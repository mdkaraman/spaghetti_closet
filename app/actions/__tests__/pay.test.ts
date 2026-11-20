import { beforeEach, expect, test, vi } from 'vitest'
import { payNow } from '../pay'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/jont/resolve', () => ({
  resolveJontForUser: vi.fn(),
}))

vi.mock('@/lib/jont', () => ({
  getJontOfTheDay: vi.fn(),
}))

const { createClient } = await import('@/lib/supabase/server')
const { resolveJontForUser } = await import('@/lib/jont/resolve')
const { getJontOfTheDay } = await import('@/lib/jont')

const JONT_ID = 'abc-123'
const USER_ID = 'user-1'
const resolvedJont = {
  id: JONT_ID,
  date: '2025-02-03',
  title: null,
  description: null,
  image_url: null,
  price_cents: null,
  created_at: '2025-02-03T12:00:00Z',
}

beforeEach(() => {
  vi.clearAllMocks()
})

function mockClient({
  user = { id: USER_ID } as { id: string } | null,
} = {}) {
  const insert = vi.fn()
  const from = vi.fn(() => ({ insert }))

  vi.mocked(createClient).mockResolvedValue({
    auth: {
      getUser: async () => ({ data: { user }, error: null }),
    },
    from,
  } as any)

  return { from, insert }
}

test('payNow redirects to the resolved jont bid page and inserts no purchase', async () => {
  const { from, insert } = mockClient()
  vi.mocked(resolveJontForUser).mockResolvedValue(resolvedJont)

  await expect(payNow()).rejects.toThrow(`NEXT_REDIRECT:/bid?jont=${JONT_ID}`)

  expect(resolveJontForUser).toHaveBeenCalledOnce()
  expect(from).not.toHaveBeenCalled()
  expect(insert).not.toHaveBeenCalled()
  expect(getJontOfTheDay).not.toHaveBeenCalled()
})

test('a logged-out submit redirects home and does not write', async () => {
  const { from, insert } = mockClient({ user: null })

  await expect(payNow()).rejects.toThrow('NEXT_REDIRECT:/')

  expect(resolveJontForUser).not.toHaveBeenCalled()
  expect(from).not.toHaveBeenCalled()
  expect(insert).not.toHaveBeenCalled()
})

test('payNow inserts no purchase when there is no jont', async () => {
  const { from, insert } = mockClient()
  vi.mocked(resolveJontForUser).mockResolvedValue(null)

  await expect(payNow()).rejects.toThrow('NEXT_REDIRECT:/user')

  expect(from).not.toHaveBeenCalled()
  expect(insert).not.toHaveBeenCalled()
})
