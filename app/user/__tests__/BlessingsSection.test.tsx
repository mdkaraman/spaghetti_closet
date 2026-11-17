import { beforeEach, expect, test, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import BlessingsSection from '../BlessingsSection'

vi.mock('next/navigation', () => ({
  useSearchParams: vi.fn(() => ({ get: () => null })),
  redirect: (url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`)
  },
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

const { useSearchParams } = await import('next/navigation')
const { createClient } = await import('@/lib/supabase/server')

beforeEach(() => {
  vi.mocked(useSearchParams).mockReturnValue({
    get: () => null,
  } as ReturnType<typeof useSearchParams>)
})

function mockUser({
  user = { id: 'user-1' } as { id: string } | null,
  blessings = [] as unknown[] | null,
  handles = [] as unknown[] | null,
} = {}) {
  const blessingsOrder = vi.fn(async () => ({ data: blessings, error: null }))
  const blessingsEq = vi.fn(() => ({ order: blessingsOrder }))
  const blessingsSelect = vi.fn(() => ({ eq: blessingsEq }))

  const handlesIn = vi.fn(async () => ({ data: handles, error: null }))
  const handlesSelect = vi.fn(() => ({ in: handlesIn }))

  const from = vi.fn((table: string) => {
    if (table === 'blessings') return { select: blessingsSelect }
    if (table === 'profile_handles') return { select: handlesSelect }
    throw new Error(`unexpected table ${table}`)
  })

  vi.mocked(createClient).mockResolvedValue({
    auth: {
      getUser: () => Promise.resolve({ data: { user }, error: null }),
    },
    from,
  } as never)

  return { from, blessingsSelect, blessingsEq, blessingsOrder, handlesSelect, handlesIn }
}

test('shows the blessings heading, handle field, and amount field', async () => {
  mockUser()
  render(await BlessingsSection())

  expect(screen.getByRole('heading', { name: 'blessings' })).toBeInTheDocument()

  const handle = screen.getByLabelText('handle:')
  const amount = screen.getByLabelText('amount:')
  expect(handle).toHaveAttribute('name', 'handle')
  expect(amount).toHaveAttribute('name', 'amount')
  expect(amount).toHaveAttribute('type', 'number')
  expect(amount).toHaveAttribute('min', '1')
  expect(amount).toHaveAttribute('step', '1')
  expect(screen.getByRole('button', { name: 'bless' })).toHaveAttribute('type', 'submit')
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})

test('shows a blessing error from the query on the blessing form', async () => {
  vi.mocked(useSearchParams).mockReturnValue({
    get: (key: string) => (key === 'bless_error' ? 'who you blessing' : null),
  } as ReturnType<typeof useSearchParams>)
  mockUser()
  render(await BlessingsSection())

  const form = screen.getByRole('button', { name: 'bless' }).closest('form')
  expect(form).not.toBeNull()
  expect(within(form as HTMLFormElement).getByRole('alert')).toHaveTextContent(
    'who you blessing'
  )
})

test('does not show a preferences error on the blessing form', async () => {
  vi.mocked(useSearchParams).mockReturnValue({
    get: (key: string) => (key === 'error' ? 'pick one from the list' : null),
  } as ReturnType<typeof useSearchParams>)
  mockUser()
  render(await BlessingsSection())

  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})

test('lists incoming blessings newest first with the giver handle and amount', async () => {
  const { blessingsSelect, blessingsEq, blessingsOrder, handlesSelect, handlesIn } = mockUser({
    blessings: [
      { id: 'b-new', amount: 5, from_user: 'user-a', created_at: '2026-11-07T12:00:00Z' },
      { id: 'b-old', amount: 1, from_user: 'user-b', created_at: '2026-11-06T08:00:00Z' },
    ],
    handles: [
      { id: 'user-a', user_id: 'ada' },
      { id: 'user-b', user_id: 'bee' },
    ],
  })

  render(await BlessingsSection())

  expect(blessingsSelect).toHaveBeenCalledWith('id, amount, from_user, created_at')
  expect(blessingsEq).toHaveBeenCalledWith('to_user', 'user-1')
  expect(blessingsOrder).toHaveBeenCalledWith('created_at', { ascending: false })
  expect(handlesSelect).toHaveBeenCalledWith('id, user_id')
  expect(handlesIn).toHaveBeenCalledWith('id', ['user-a', 'user-b'])

  const items = screen.getAllByRole('listitem')
  expect(items).toHaveLength(2)
  expect(items[0]).toHaveTextContent('ada')
  expect(items[0]).toHaveTextContent('5')
  expect(items[1]).toHaveTextContent('bee')
  expect(items[1]).toHaveTextContent('1')
})

test('a giver without a handle still shows the amount', async () => {
  mockUser({
    blessings: [
      { id: 'b-1', amount: 2, from_user: 'user-a', created_at: '2026-11-07T12:00:00Z' },
    ],
    handles: [],
  })

  render(await BlessingsSection())

  const item = screen.getByRole('listitem')
  expect(item).toHaveTextContent('—')
  expect(item).toHaveTextContent('2')
})

test('does not query handles when there are no incoming blessings', async () => {
  const { handlesSelect } = mockUser({ blessings: [] })
  render(await BlessingsSection())

  expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
  expect(handlesSelect).not.toHaveBeenCalled()
})

test('logged-out section renders nothing and does not query', async () => {
  const { from } = mockUser({ user: null })
  const section = await BlessingsSection()

  expect(section).toBeNull()
  expect(from).not.toHaveBeenCalled()
})
