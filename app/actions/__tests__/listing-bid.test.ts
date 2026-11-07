import { beforeEach, expect, test, vi } from 'vitest'
import { placeListingBid } from '../listing-bid'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

const { createClient } = await import('@/lib/supabase/server')

const LISTING = 'listing-1'
const SELLER = 'seller-1'
const BIDDER = 'bidder-1'

function form(amount: string, listing: string = LISTING) {
  const fd = new FormData()
  fd.set('listing', listing)
  fd.set('amount', amount)
  return fd
}

function errorRedirect(message: string) {
  return `NEXT_REDIRECT:/sell/${LISTING}?error=${encodeURIComponent(message)}`
}

beforeEach(() => {
  vi.clearAllMocks()
})

function mockClient({
  user = { id: BIDDER } as { id: string } | null,
  listing = { seller_id: SELLER, status: 'open' } as { seller_id: string; status: string } | null,
  writeError = null as { message: string } | null,
} = {}) {
  const maybeSingle = vi.fn(async () => ({ data: listing, error: null }))
  const upsert = vi.fn(async () => ({ error: writeError }))

  vi.mocked(createClient).mockResolvedValue({
    auth: {
      getUser: async () => ({ data: { user }, error: null }),
    },
    from: (table: string) => {
      if (table === 'listings') {
        return { select: () => ({ eq: () => ({ maybeSingle }) }) }
      }
      if (table === 'bids') return { upsert }
      throw new Error(`unexpected table ${table}`)
    },
  } as any)

  return { upsert }
}

test('another user bids in cents on the listing, with no jont', async () => {
  const { upsert } = mockClient()

  await expect(placeListingBid(form('20'))).rejects.toThrow(`NEXT_REDIRECT:/sell/${LISTING}`)

  expect(upsert).toHaveBeenCalledWith(
    { listing_id: LISTING, user_id: BIDDER, amount_cents: 2000 },
    { onConflict: 'listing_id,user_id' },
  )
})

test('the seller cannot bid on their own listing', async () => {
  const { upsert } = mockClient({ user: { id: SELLER } })

  await expect(placeListingBid(form('20'))).rejects.toThrow(
    errorRedirect('can’t bid on your own listing'),
  )
  expect(upsert).not.toHaveBeenCalled()
})

test('$1 is the minimum and stores 100 cents', async () => {
  const { upsert } = mockClient()

  await expect(placeListingBid(form('1'))).rejects.toThrow(`NEXT_REDIRECT:/sell/${LISTING}`)
  expect(upsert).toHaveBeenCalledWith(
    { listing_id: LISTING, user_id: BIDDER, amount_cents: 100 },
    { onConflict: 'listing_id,user_id' },
  )
})

test.each(['0', '0.50', '1.5', '-3', ''])('%j is under the $1 minimum and does not write', async (amount) => {
  const { upsert } = mockClient()

  await expect(placeListingBid(form(amount))).rejects.toThrow(
    errorRedirect('whole dollars, $1 minimum'),
  )
  expect(upsert).not.toHaveBeenCalled()
})

test('a closed listing takes no bids', async () => {
  const { upsert } = mockClient({ listing: { seller_id: SELLER, status: 'closed' } })

  await expect(placeListingBid(form('20'))).rejects.toThrow(errorRedirect('bidding is closed'))
  expect(upsert).not.toHaveBeenCalled()
})

test('a missing listing takes no bids', async () => {
  const { upsert } = mockClient({ listing: null })

  await expect(placeListingBid(form('20'))).rejects.toThrow(errorRedirect('no listing'))
  expect(upsert).not.toHaveBeenCalled()
})

test('a logged-out submit redirects home and does not write', async () => {
  const { upsert } = mockClient({ user: null })

  await expect(placeListingBid(form('20'))).rejects.toThrow(/^NEXT_REDIRECT:\/$/)
  expect(upsert).not.toHaveBeenCalled()
})

test('a failed write stays on the listing with an error', async () => {
  mockClient({ writeError: { message: 'nope' } })

  await expect(placeListingBid(form('20'))).rejects.toThrow(errorRedirect('couldn’t save that bid'))
})
