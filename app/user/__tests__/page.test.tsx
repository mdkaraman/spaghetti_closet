import { expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import UserPage from '../page'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

const { createClient } = await import('@/lib/supabase/server')

const user = { id: 'user-1', email: 'auth@example.com' }

function emptyQuery() {
  const result = { data: [] as unknown[], error: null }
  const query: any = new Proxy(function () {}, {
    get(_target, prop) {
      if (prop === 'then') {
        return (
          onFulfilled: (value: typeof result) => unknown,
          onRejected?: (reason: unknown) => unknown
        ) => Promise.resolve(result).then(onFulfilled, onRejected)
      }
      return query
    },
    apply() {
      return query
    },
  })
  return query
}

function mockSupabase({
  currentUser = user as { id: string; email?: string } | null,
  profile = { user_id: 'coolhandle', email: 'a@b.co' } as { user_id: string; email: string } | null,
  purchases = [] as unknown[] | null,
} = {}) {
  const purchasesOrder = vi.fn(async () => ({ data: purchases, error: null }))
  const purchasesEq = vi.fn(() => ({ order: purchasesOrder }))
  const purchasesSelect = vi.fn(() => ({ eq: purchasesEq }))

  vi.mocked(createClient).mockResolvedValue({
    auth: {
      getUser: () => Promise.resolve({ data: { user: currentUser }, error: null }),
    },
    rpc: vi.fn(async () => ({ data: 0, error: null })),
    from: (table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: profile, error: null }),
            }),
          }),
        }
      }
      if (table === 'purchases') {
        return { select: purchasesSelect }
      }
      return emptyQuery()
    },
  } as any)

  return { purchasesSelect, purchasesEq, purchasesOrder }
}

test('redirects home when not logged in', async () => {
  const from = vi.fn()
  vi.mocked(createClient).mockResolvedValue({
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    },
    from,
  } as any)

  await expect(UserPage()).rejects.toThrow('NEXT_REDIRECT:/')
  expect(from).not.toHaveBeenCalled()
})

test('shows user id and email from profile', async () => {
  mockSupabase()
  render(await UserPage())

  expect(screen.getByText('coolhandle')).toBeInTheDocument()
  expect(screen.getByText('a@b.co')).toBeInTheDocument()
})

test('falls back to auth email when profile is missing', async () => {
  mockSupabase({ profile: null })
  render(await UserPage())

  expect(screen.getByText('—')).toBeInTheDocument()
  expect(screen.getByText('auth@example.com')).toBeInTheDocument()
})

test('loads this user purchases newest first', async () => {
  const { purchasesSelect, purchasesEq, purchasesOrder } = mockSupabase()
  render(await UserPage())

  expect(purchasesSelect).toHaveBeenCalledWith(
    'created_at, jonts(title, date, image_url, price_cents)'
  )
  expect(purchasesEq).toHaveBeenCalledWith('user_id', 'user-1')
  expect(purchasesOrder).toHaveBeenCalledWith('created_at', { ascending: false })
})

test('shows copped jonts with title, date, price, and image', async () => {
  mockSupabase({
    purchases: [
      {
        created_at: '2025-02-03T18:00:00Z',
        jonts: {
          title: 'this that hoodie tho',
          date: '2025-02-03',
          image_url: '/hoodie.png',
          price_cents: 2000,
        },
      },
      {
        created_at: '2025-02-01T18:00:00Z',
        jonts: {
          title: 'earlier tee',
          date: '2025-02-01',
          image_url: null,
          price_cents: null,
        },
      },
    ],
  })
  render(await UserPage())

  expect(screen.getByRole('heading', { name: /you copped it/i })).toBeInTheDocument()
  const items = screen.getAllByRole('listitem')
  expect(items).toHaveLength(2)
  expect(items[0]).toHaveTextContent('this that hoodie tho')
  expect(items[0]).toHaveTextContent('2025-02-03 · $20')
  const img = screen.getByRole('img', { name: /this that hoodie tho/i })
  expect(img).toHaveAttribute('src', '/hoodie.png')
  expect(items[1]).toHaveTextContent('earlier tee')
  expect(items[1]).toHaveTextContent('2025-02-01')
  expect(items[1].querySelector('img')).toBeNull()
  expect(screen.queryByText(/nothing yet/i)).not.toBeInTheDocument()
})

test('shows empty state when user has no purchases', async () => {
  mockSupabase({ purchases: [] })
  render(await UserPage())

  expect(screen.getByRole('heading', { name: /you copped it/i })).toBeInTheDocument()
  expect(screen.getByText(/nothing yet/i)).toBeInTheDocument()
  expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
})

test('skips a purchase whose jont is missing', async () => {
  mockSupabase({
    purchases: [{ created_at: '2025-02-03T18:00:00Z', jonts: null }],
  })
  render(await UserPage())

  expect(screen.getByText(/nothing yet/i)).toBeInTheDocument()
})

test('keeps back to the jont link', async () => {
  mockSupabase()
  render(await UserPage())

  const link = screen.getByRole('link', { name: /back to the jont/i })
  expect(link).toHaveAttribute('href', '/jont')
})
