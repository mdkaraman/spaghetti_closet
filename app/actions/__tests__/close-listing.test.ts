import { beforeEach, expect, test, vi } from 'vitest'
import { closeListingIfDue } from '../close-listing'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

const { createClient } = await import('@/lib/supabase/server')

beforeEach(() => {
  vi.clearAllMocks()
})

function mockClient(rpcError: { message: string } | null = null) {
  const rpc = vi.fn(async () => ({ data: null, error: rpcError }))
  const from = vi.fn()
  vi.mocked(createClient).mockResolvedValue({ rpc, from } as any)
  return { rpc, from }
}

test('the close passes only the listing, so the caller cannot pick the winner', async () => {
  const { rpc } = mockClient()

  await closeListingIfDue('listing-1')

  expect(rpc).toHaveBeenCalledWith('close_listing_if_due', { listing_id: 'listing-1' })
})

test('a repeat close only calls the database function and writes no rows itself', async () => {
  const { rpc, from } = mockClient()

  await closeListingIfDue('listing-1')
  await closeListingIfDue('listing-1')

  expect(rpc).toHaveBeenCalledTimes(2)
  expect(from).not.toHaveBeenCalled()
})

test('a failed close surfaces the database error', async () => {
  mockClient({ message: 'function does not exist' })

  await expect(closeListingIfDue('listing-1')).rejects.toThrow('function does not exist')
})
