import { expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import BucksSection from '../BucksSection'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

const { createClient } = await import('@/lib/supabase/server')

function mockRpc(data: number | null, error: { message: string } | null = null) {
  const rpc = vi.fn(async () => ({ data, error }))
  vi.mocked(createClient).mockResolvedValue({ rpc } as never)
  return rpc
}

test('shows the caller balance from my_spaghetti_bucks', async () => {
  const rpc = mockRpc(12)
  render(await BucksSection())

  expect(rpc).toHaveBeenCalledWith('my_spaghetti_bucks')
  expect(screen.getByRole('heading', { name: /spaghetti bucks/i })).toBeInTheDocument()
  expect(screen.getByText('12')).toBeInTheDocument()
})

test('shows 0 when the caller has no bucks', async () => {
  mockRpc(0)
  render(await BucksSection())

  expect(screen.getByRole('heading', { name: /spaghetti bucks/i })).toBeInTheDocument()
  expect(screen.getByText('0')).toBeInTheDocument()
})

test('shows 0 when the balance call fails', async () => {
  mockRpc(null, { message: 'not implemented' })
  render(await BucksSection())

  expect(screen.getByText('0')).toBeInTheDocument()
})
