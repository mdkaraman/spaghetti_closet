import { expect, test, vi } from 'vitest'
import ListingPage from '../page'

vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`)
  },
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND')
  },
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

const { createClient } = await import('@/lib/supabase/server')

function mockSupabase() {
  const rpc = vi.fn(async () => ({ data: null, error: null }))
  const maybeSingle = vi.fn(async () => ({ data: null, error: null }))
  const from = vi.fn(() => ({
    select: () => ({ eq: () => ({ maybeSingle }) }),
  }))

  vi.mocked(createClient).mockResolvedValue({
    auth: {
      getUser: () => Promise.resolve({ data: { user: { id: 'user-1' } }, error: null }),
    },
    rpc,
    from,
  } as any)

  return { rpc, from }
}

test('a non-uuid id is not found without closing or querying', async () => {
  const { rpc, from } = mockSupabase()

  await expect(ListingPage({ params: { id: 'not-a-uuid' } })).rejects.toThrow('NEXT_NOT_FOUND')
  expect(rpc).not.toHaveBeenCalled()
  expect(from).not.toHaveBeenCalled()
})

test('a uuid id with no listing is not found after the lazy close runs', async () => {
  const { rpc } = mockSupabase()
  const id = '3f2b8c1e-9a4d-4e6f-8b2a-1c5d7e9f0a3b'

  await expect(ListingPage({ params: { id } })).rejects.toThrow('NEXT_NOT_FOUND')
  expect(rpc).toHaveBeenCalledWith('close_listing_if_due', { listing_id: id })
})
