import { expect, test, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import SellPage from '../page'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

const { createClient } = await import('@/lib/supabase/server')

const caller = { id: 'user-1' }

function section(name: RegExp) {
  const node = screen.getByRole('heading', { name }).closest('section')
  if (!node) throw new Error(`missing section ${name}`)
  return node as HTMLElement
}

function mockSupabase({
  currentUser = caller as { id: string } | null,
  purchases = [] as unknown[],
  listings = [] as unknown[],
} = {}) {
  const purchaseOrder = vi.fn(async () => ({ data: purchases, error: null }))
  const purchaseEq = vi.fn(() => ({ order: purchaseOrder }))
  const purchaseSelect = vi.fn(() => ({ eq: purchaseEq }))

  const listingOrder = vi.fn(async () => ({ data: listings, error: null }))
  const listingEq = vi.fn(() => ({ order: listingOrder }))
  const listingSelect = vi.fn(() => ({ eq: listingEq }))

  const from = vi.fn((table: string) => {
    if (table === 'purchases') return { select: purchaseSelect }
    if (table === 'listings') return { select: listingSelect }
    throw new Error(`unexpected table ${table}`)
  })

  vi.mocked(createClient).mockResolvedValue({
    auth: {
      getUser: () => Promise.resolve({ data: { user: currentUser }, error: null }),
    },
    from,
  } as any)

  return {
    from,
    purchaseSelect,
    purchaseEq,
    purchaseOrder,
    listingSelect,
    listingEq,
    listingOrder,
  }
}

test('redirects home when not logged in', async () => {
  const { from } = mockSupabase({ currentUser: null })

  await expect(SellPage({})).rejects.toThrow(/^NEXT_REDIRECT:\/$/)
  expect(from).not.toHaveBeenCalled()
})

test('loads this user’s purchases and listings', async () => {
  const {
    purchaseSelect,
    purchaseEq,
    purchaseOrder,
    listingSelect,
    listingEq,
    listingOrder,
  } = mockSupabase()

  render(await SellPage({}))

  expect(purchaseSelect).toHaveBeenCalledWith(
    'id, user_id, created_at, jont_id, jonts(title, date)'
  )
  expect(purchaseEq).toHaveBeenCalledWith('user_id', 'user-1')
  expect(purchaseOrder).toHaveBeenCalledWith('created_at', { ascending: false })
  expect(listingSelect).toHaveBeenCalledWith(
    'id, status, purchase_id, created_at, jonts(title, date)'
  )
  expect(listingEq).toHaveBeenCalledWith('seller_id', 'user-1')
  expect(listingOrder).toHaveBeenCalledWith('created_at', { ascending: false })
})

test('offers an unlisted purchase the caller owns', async () => {
  mockSupabase({
    purchases: [
      {
        id: 'p-1',
        user_id: 'user-1',
        created_at: '2026-01-02T00:00:00Z',
        jont_id: 'j-1',
        jonts: { title: 'this that hoodie tho', date: '2026-01-02' },
      },
    ],
  })

  render(await SellPage({}))

  const notListed = section(/^not listed$/i)
  expect(within(notListed).getByText('this that hoodie tho')).toBeInTheDocument()
  expect(within(notListed).getByText('2026-01-02')).toBeInTheDocument()
  expect(within(notListed).getByRole('button', { name: /list it/i })).toHaveAttribute(
    'type',
    'submit'
  )
  expect(notListed.querySelector('input[name="purchase_id"]')).toHaveValue('p-1')
})

test('does not offer a purchase that already has a listing or belongs to someone else', async () => {
  mockSupabase({
    purchases: [
      {
        id: 'p-listed',
        user_id: 'user-1',
        created_at: '2026-01-02T00:00:00Z',
        jont_id: 'j-1',
        jonts: { title: 'listed hoodie', date: '2026-01-02' },
      },
      {
        id: 'p-fresh',
        user_id: 'user-1',
        created_at: '2026-01-03T00:00:00Z',
        jont_id: 'j-2',
        jonts: { title: 'fresh tee', date: '2026-01-03' },
      },
      {
        id: 'p-other',
        user_id: 'someone-else',
        created_at: '2026-01-04T00:00:00Z',
        jont_id: 'j-3',
        jonts: { title: 'not mine', date: '2026-01-04' },
      },
    ],
    listings: [
      {
        id: 'l-1',
        status: 'open',
        purchase_id: 'p-listed',
        created_at: '2026-01-05T00:00:00Z',
        jonts: [{ title: 'listed hoodie', date: '2026-01-02' }],
      },
    ],
  })

  render(await SellPage({}))

  const notListed = section(/^not listed$/i)
  expect(within(notListed).queryByText('listed hoodie')).not.toBeInTheDocument()
  expect(within(notListed).queryByText('not mine')).not.toBeInTheDocument()
  expect(within(notListed).getByText('fresh tee')).toBeInTheDocument()
  expect(notListed.querySelector('input[name="purchase_id"]')).toHaveValue('p-fresh')

  const open = section(/^open$/i)
  expect(within(open).getByText('listed hoodie')).toBeInTheDocument()
  expect(within(open).queryByRole('button')).not.toBeInTheDocument()
})

test('shows a closed listing and does not offer that purchase again', async () => {
  mockSupabase({
    purchases: [
      {
        id: 'p-closed',
        user_id: 'user-1',
        created_at: '2026-01-01T00:00:00Z',
        jont_id: 'j-9',
        jonts: { title: 'sold pants', date: '2026-01-01' },
      },
    ],
    listings: [
      {
        id: 'l-closed',
        status: 'closed',
        purchase_id: 'p-closed',
        created_at: '2026-01-08T00:00:00Z',
        jonts: { title: 'sold pants', date: '2026-01-01' },
      },
    ],
  })

  render(await SellPage({}))

  expect(within(section(/^not listed$/i)).getByText('nothing to sell')).toBeInTheDocument()
  expect(within(section(/^open$/i)).getByText('none open')).toBeInTheDocument()
  expect(within(section(/^closed$/i)).getByText('sold pants')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /list it/i })).not.toBeInTheDocument()
})

test('shows empty copy when there is nothing to sell', async () => {
  mockSupabase()

  render(await SellPage({}))

  expect(screen.getByText('nothing to sell')).toBeInTheDocument()
  expect(screen.getByText('none open')).toBeInTheDocument()
  expect(screen.getByText('none closed')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /my ish/i })).toHaveAttribute('href', '/user')
})

test('shows the error from the query string', async () => {
  mockSupabase()

  render(await SellPage({ searchParams: { error: 'not yours' } }))

  expect(screen.getByText('not yours')).toBeInTheDocument()
})
