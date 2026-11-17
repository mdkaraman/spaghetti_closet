import { beforeEach, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import WinnerSlot from '../WinnerSlot'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/date', () => ({
  todayEastCoast: vi.fn(() => '2026-11-17'),
}))

const { createClient } = await import('@/lib/supabase/server')
const { todayEastCoast } = await import('@/lib/date')

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(todayEastCoast).mockReturnValue('2026-11-17')
})

function mockSupabase({
  bids = [] as unknown[] | null,
  bidsError = null as { message: string } | null,
  balances = [] as unknown[] | null,
  handles = [] as unknown[] | null,
  jont = { date: '2026-11-17' } as { date: string } | null,
} = {}) {
  const bidsEq = vi.fn(async () => ({ data: bids, error: bidsError }))
  const bidsSelect = vi.fn(() => ({ eq: bidsEq }))

  const handlesIn = vi.fn(async () => ({ data: handles, error: null }))
  const handlesSelect = vi.fn(() => ({ in: handlesIn }))

  const jontMaybeSingle = vi.fn(async () => ({ data: jont, error: null }))
  const jontEq = vi.fn(() => ({ maybeSingle: jontMaybeSingle }))
  const jontSelect = vi.fn(() => ({ eq: jontEq }))

  const rpc = vi.fn(async () => ({ data: balances, error: null }))

  vi.mocked(createClient).mockResolvedValue({
    from: (table: string) => {
      if (table === 'bids') return { select: bidsSelect }
      if (table === 'profile_handles') return { select: handlesSelect }
      if (table === 'jonts') return { select: jontSelect }
      throw new Error(`unexpected table ${table}`)
    },
    rpc,
  } as any)

  return { bidsSelect, bidsEq, handlesSelect, handlesIn, jontSelect, jontEq, rpc }
}

const twoBids = [
  { user_id: 'user-a', amount_cents: 2000, created_at: '2026-11-17T12:00:00.000Z' },
  { user_id: 'user-b', amount_cents: 1000, created_at: '2026-11-17T11:00:00.000Z' },
]

const twoHandles = [
  { id: 'user-a', user_id: 'ada' },
  { id: 'user-b', user_id: 'bee' },
]

const twoBalances = [
  { user_id: 'user-a', balance: 4 },
  { user_id: 'user-b', balance: 12 },
]

test('a blank jont does not query', async () => {
  mockSupabase()
  const { container } = render(await WinnerSlot({ jontId: '' }))

  expect(container).toBeEmptyDOMElement()
  expect(createClient).not.toHaveBeenCalled()
})

test('renders nothing when the jont has no bids', async () => {
  const { handlesSelect } = mockSupabase({ bids: [] })
  const { container } = render(await WinnerSlot({ jontId: 'jont-1' }))

  expect(container).toBeEmptyDOMElement()
  expect(handlesSelect).not.toHaveBeenCalled()
})

test('renders nothing when bids fail to load', async () => {
  const { handlesSelect } = mockSupabase({
    bids: null,
    bidsError: { message: 'fail' },
  })
  const { container } = render(await WinnerSlot({ jontId: 'jont-1' }))

  expect(container).toBeEmptyDOMElement()
  expect(handlesSelect).not.toHaveBeenCalled()
})

test('shows high bid and the higher bidder handle', async () => {
  const { handlesSelect, handlesIn, rpc } = mockSupabase({
    bids: twoBids,
    balances: twoBalances,
    handles: twoHandles,
  })

  render(await WinnerSlot({ jontId: 'jont-1' }))

  expect(rpc).toHaveBeenCalledWith('balances_for_bidders', { jont_id: 'jont-1' })
  expect(handlesSelect).toHaveBeenCalledWith('id, user_id')
  expect(handlesIn).toHaveBeenCalledWith('id', ['user-a', 'user-b'])
  expect(screen.getByRole('heading', { name: 'high bid' })).toBeInTheDocument()
  expect(screen.getByText('ada')).toBeInTheDocument()
  expect(screen.queryByText('bee')).not.toBeInTheDocument()
})

test('shows the higher-balance handle when amounts match', async () => {
  mockSupabase({
    bids: [
      { user_id: 'user-a', amount_cents: 2000, created_at: '2026-11-17T12:00:00.000Z' },
      { user_id: 'user-b', amount_cents: 2000, created_at: '2026-11-17T11:00:00.000Z' },
    ],
    balances: twoBalances,
    handles: twoHandles,
  })

  render(await WinnerSlot({ jontId: 'jont-1' }))

  expect(screen.getByRole('heading', { name: 'high bid' })).toBeInTheDocument()
  expect(screen.getByText('bee')).toBeInTheDocument()
  expect(screen.queryByText('ada')).not.toBeInTheDocument()
})

test('labels the slot winner after the jont date', async () => {
  mockSupabase({
    bids: twoBids,
    balances: twoBalances,
    handles: twoHandles,
    jont: { date: '2026-11-16' },
  })

  render(await WinnerSlot({ jontId: 'jont-1' }))

  expect(screen.getByRole('heading', { name: 'winner' })).toBeInTheDocument()
  expect(screen.getByText('ada')).toBeInTheDocument()
})

test('falls back to a dash when the winner has no handle', async () => {
  mockSupabase({
    bids: twoBids,
    balances: twoBalances,
    handles: [],
  })

  render(await WinnerSlot({ jontId: 'jont-1' }))

  expect(screen.getByRole('heading', { name: 'high bid' })).toBeInTheDocument()
  expect(screen.getByText('—')).toBeInTheDocument()
})
