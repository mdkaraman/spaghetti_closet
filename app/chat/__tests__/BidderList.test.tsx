import { beforeEach, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import BidderList, { BidderListView } from '../BidderList'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/jont', () => ({
  getJontOfTheDay: vi.fn(),
}))

const { createClient } = await import('@/lib/supabase/server')
const { getJontOfTheDay } = await import('@/lib/jont')

beforeEach(() => {
  vi.clearAllMocks()
})

function mockSupabase({
  bids = [] as unknown[] | null,
  handles = [] as unknown[] | null,
  bidsError = null as { message: string } | null,
} = {}) {
  const orderCreated = vi.fn(async () => ({ data: bids, error: bidsError }))
  const orderAmount = vi.fn(() => ({ order: orderCreated }))
  const bidsEq = vi.fn(() => ({ order: orderAmount }))
  const bidsSelect = vi.fn(() => ({ eq: bidsEq }))

  const handlesIn = vi.fn(async () => ({ data: handles, error: null }))
  const handlesSelect = vi.fn(() => ({ in: handlesIn }))

  vi.mocked(createClient).mockResolvedValue({
    from: (table: string) => {
      if (table === 'bids') return { select: bidsSelect }
      if (table === 'profile_handles') return { select: handlesSelect }
      throw new Error(`unexpected table ${table}`)
    },
  } as any)

  return { bidsSelect, bidsEq, orderAmount, orderCreated, handlesSelect, handlesIn }
}

test('renders handles and whole-dollar amounts', () => {
  render(
    <BidderListView
      bidders={[
        { userId: 'user-a', handle: 'ada', amountCents: 2000 },
        { userId: 'user-b', handle: 'bee', amountCents: 100 },
      ]}
    />
  )

  const items = screen.getAllByRole('listitem')
  expect(items).toHaveLength(2)
  expect(items[0]).toHaveTextContent('ada')
  expect(items[0]).toHaveTextContent('$20')
  expect(items[1]).toHaveTextContent('bee')
  expect(items[1]).toHaveTextContent('$1')
  expect(screen.getByRole('heading', { name: /^bids$/i })).toBeInTheDocument()
})

test('empty list says no bids yet', () => {
  render(<BidderListView bidders={[]} />)
  expect(screen.getByText('no bids yet')).toBeInTheDocument()
  expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
})

test('loads bidder names from profile_handles for the jont', async () => {
  const { bidsSelect, bidsEq, orderAmount, orderCreated, handlesSelect, handlesIn } =
    mockSupabase({
      bids: [
        { user_id: 'user-a', amount_cents: 2000, created_at: '2026-10-25T16:00:00.000Z' },
        { user_id: 'user-b', amount_cents: 1500, created_at: '2026-10-25T15:00:00.000Z' },
      ],
      handles: [
        { id: 'user-a', user_id: 'ada' },
        { id: 'user-b', user_id: 'bee' },
      ],
    })

  render(await BidderList({ jontId: 'jont-1' }))

  expect(bidsSelect).toHaveBeenCalledWith('user_id, amount_cents, created_at')
  expect(bidsEq).toHaveBeenCalledWith('jont_id', 'jont-1')
  expect(orderAmount).toHaveBeenCalledWith('amount_cents', { ascending: false })
  expect(orderCreated).toHaveBeenCalledWith('created_at', { ascending: true })
  expect(handlesSelect).toHaveBeenCalledWith('id, user_id')
  expect(handlesIn).toHaveBeenCalledWith('id', ['user-a', 'user-b'])

  const items = screen.getAllByRole('listitem')
  expect(items[0]).toHaveTextContent('ada')
  expect(items[0]).toHaveTextContent('$20')
  expect(items[1]).toHaveTextContent('bee')
  expect(items[1]).toHaveTextContent('$15')
  expect(getJontOfTheDay).not.toHaveBeenCalled()
})

test('a bidder without a handle still shows the amount', async () => {
  mockSupabase({
    bids: [{ user_id: 'user-a', amount_cents: 100, created_at: '2026-10-25T15:00:00.000Z' }],
    handles: [],
  })

  render(await BidderList({ jontId: 'jont-1' }))

  const item = screen.getByRole('listitem')
  expect(item).toHaveTextContent('—')
  expect(item).toHaveTextContent('$1')
})

test('no bids yet when the jont has none, and handles are not queried', async () => {
  const { handlesSelect } = mockSupabase({ bids: [] })

  render(await BidderList({ jontId: 'jont-1' }))

  expect(screen.getByText('no bids yet')).toBeInTheDocument()
  expect(handlesSelect).not.toHaveBeenCalled()
  expect(getJontOfTheDay).not.toHaveBeenCalled()
})

test('a blank jont does not query', async () => {
  mockSupabase()
  const { container } = render(await BidderList({ jontId: '' }))

  expect(container).toBeEmptyDOMElement()
  expect(createClient).not.toHaveBeenCalled()
  expect(getJontOfTheDay).not.toHaveBeenCalled()
})
