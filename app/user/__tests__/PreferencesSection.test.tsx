import { beforeEach, expect, test, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import PreferencesSection from '../PreferencesSection'

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
  profile = null as { size: string | null; jont_type: string | null } | null,
} = {}) {
  const single = vi.fn(async () => ({ data: profile, error: null }))
  const eq = vi.fn(() => ({ single }))
  const select = vi.fn(() => ({ eq }))
  const from = vi.fn((table: string) => {
    if (table !== 'profiles') throw new Error(`unexpected table ${table}`)
    return { select }
  })
  vi.mocked(createClient).mockResolvedValue({
    auth: {
      getUser: () => Promise.resolve({ data: { user }, error: null }),
    },
    from,
  } as any)
  return { from, select, eq }
}

test('shows the contract sizes and types plus an empty choice', async () => {
  mockUser({ profile: { size: 'L', jont_type: 'shirt' } })
  render(await PreferencesSection())

  expect(screen.getByRole('heading', { name: 'preferences' })).toBeInTheDocument()

  const size = screen.getByLabelText('size:')
  const type = screen.getByLabelText('type:')
  expect(size).toHaveAttribute('name', 'size')
  expect(type).toHaveAttribute('name', 'jont_type')
  expect(size).toHaveValue('L')
  expect(type).toHaveValue('shirt')

  expect(within(size).getByRole('option', { name: 'none' })).toHaveValue('')
  for (const option of ['S', 'M', 'L', 'XL']) {
    expect(within(size).getByRole('option', { name: option })).toHaveValue(option)
  }
  expect(within(size).getAllByRole('option')).toHaveLength(5)

  expect(within(type).getByRole('option', { name: 'none' })).toHaveValue('')
  for (const option of ['shirt', 'pants', 'shoes', 'other']) {
    expect(within(type).getByRole('option', { name: option })).toHaveValue(option)
  }
  expect(within(type).getAllByRole('option')).toHaveLength(5)

  expect(screen.getByRole('button', { name: 'save' })).toHaveAttribute('type', 'submit')
})

test('loads the caller profile and selects the saved values', async () => {
  const { select, eq } = mockUser({ profile: { size: 'XL', jont_type: 'shoes' } })
  render(await PreferencesSection())

  expect(select).toHaveBeenCalledWith('size, jont_type')
  expect(eq).toHaveBeenCalledWith('id', 'user-1')
  expect(screen.getByLabelText('size:')).toHaveValue('XL')
  expect(screen.getByLabelText('type:')).toHaveValue('shoes')
})

test('empty preferences select the empty choice', async () => {
  mockUser({ profile: { size: null, jont_type: null } })
  render(await PreferencesSection())

  expect(screen.getByLabelText('size:')).toHaveValue('')
  expect(screen.getByLabelText('type:')).toHaveValue('')
})

test('a stored value outside the list shows the empty choice', async () => {
  mockUser({ profile: { size: 'XXL', jont_type: 'hat' } })
  render(await PreferencesSection())

  expect(screen.getByLabelText('size:')).toHaveValue('')
  expect(screen.getByLabelText('type:')).toHaveValue('')
})

test('shows a save error from the query', async () => {
  vi.mocked(useSearchParams).mockReturnValue({
    get: (key: string) => (key === 'error' ? 'pick one from the list' : null),
  } as ReturnType<typeof useSearchParams>)
  mockUser({ profile: { size: 'M', jont_type: 'pants' } })
  render(await PreferencesSection())

  expect(screen.getByRole('alert')).toHaveTextContent('pick one from the list')
})

test('logged-out section renders nothing and does not query', async () => {
  const { from } = mockUser({ user: null })
  const section = await PreferencesSection()

  expect(section).toBeNull()
  expect(from).not.toHaveBeenCalled()
})
