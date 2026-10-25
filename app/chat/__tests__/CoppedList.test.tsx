import { expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import CoppedList, { CoppedHandles, handlesFromPurchases } from '../CoppedList'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

const { createClient } = await import('@/lib/supabase/server')

function mockSupabase({
  purchases = [] as { user_id: string; created_at: string }[] | null,
  handles = [] as { id: string; user_id: string }[] | null,
} = {}) {
  const purchasesOrder = vi.fn(async () => ({ data: purchases, error: null }))
  const purchasesEq = vi.fn(() => ({ order: purchasesOrder }))
  const purchasesSelect = vi.fn(() => ({ eq: purchasesEq }))

  const handlesIn = vi.fn(async () => ({ data: handles, error: null }))
  const handlesSelect = vi.fn(() => ({ in: handlesIn }))

  vi.mocked(createClient).mockResolvedValue({
    from: (table: string) => {
      if (table === 'purchases') return { select: purchasesSelect }
      if (table === 'profile_handles') return { select: handlesSelect }
      throw new Error(`unexpected table ${table}`)
    },
  } as any)

  return { purchasesSelect, purchasesEq, purchasesOrder, handlesSelect, handlesIn }
}

test('pairs purchases with profile handles in purchase order', () => {
  expect(
    handlesFromPurchases(
      [{ user_id: 'u1' }, { user_id: 'u2' }, { user_id: 'u3' }],
      [
        { id: 'u2', user_id: 'bee' },
        { id: 'u1', user_id: 'ada' },
      ]
    )
  ).toEqual(['ada', 'bee'])
})

test('shows who copped this jont', () => {
  render(<CoppedHandles handles={['ada', 'bee']} />)
  const items = screen.getAllByRole('listitem')
  expect(items.map((item) => item.textContent)).toEqual(['ada', 'bee'])
  expect(screen.queryByText('nobody copped it yet')).not.toBeInTheDocument()
})

test('says nobody copped it yet when the list is empty', () => {
  render(<CoppedHandles handles={[]} />)
  expect(screen.getByRole('heading', { name: 'copped' })).toBeInTheDocument()
  expect(screen.getByText('nobody copped it yet')).toBeInTheDocument()
  expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
})

test('loads purchases and handles for the jont in the query param', async () => {
  const { purchasesSelect, purchasesEq, purchasesOrder, handlesSelect, handlesIn } =
    mockSupabase({
      purchases: [
        { user_id: 'u1', created_at: '2026-02-01T00:00:00.000Z' },
        { user_id: 'u2', created_at: '2026-02-02T00:00:00.000Z' },
      ],
      handles: [
        { id: 'u1', user_id: 'ada' },
        { id: 'u2', user_id: 'bee' },
      ],
    })

  render(await CoppedList({ jontId: 'jont-9' }))

  expect(purchasesSelect).toHaveBeenCalledWith('user_id, created_at')
  expect(purchasesEq).toHaveBeenCalledWith('jont_id', 'jont-9')
  expect(purchasesOrder).toHaveBeenCalledWith('created_at', { ascending: true })
  expect(handlesSelect).toHaveBeenCalledWith('id, user_id')
  expect(handlesIn).toHaveBeenCalledWith('id', ['u1', 'u2'])
  expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
    'ada',
    'bee',
  ])
})

test('does not look up handles when nobody has copped it', async () => {
  const { handlesSelect } = mockSupabase({ purchases: [] })
  render(await CoppedList({ jontId: 'jont-9' }))
  expect(handlesSelect).not.toHaveBeenCalled()
  expect(screen.getByText('nobody copped it yet')).toBeInTheDocument()
})

test('skips a purchase that has no handle', async () => {
  mockSupabase({
    purchases: [{ user_id: 'u1', created_at: '2026-02-01T00:00:00.000Z' }],
    handles: [],
  })
  render(await CoppedList({ jontId: 'jont-9' }))
  expect(screen.getByText('nobody copped it yet')).toBeInTheDocument()
})

test('shows the empty copy when the jont id is missing', async () => {
  vi.mocked(createClient).mockClear()
  render(await CoppedList({ jontId: '' }))
  expect(createClient).not.toHaveBeenCalled()
  expect(screen.getByText('nobody copped it yet')).toBeInTheDocument()
})
