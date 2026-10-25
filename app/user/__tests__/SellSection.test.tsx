import { expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import SellSection from '../SellSection'
import UserPage from '../page'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

const { createClient } = await import('@/lib/supabase/server')

test('links to the sell page', () => {
  render(<SellSection />)

  expect(screen.getByRole('heading', { name: /^sell$/i })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /put one up/i })).toHaveAttribute('href', '/sell')
})

test('user page links to sell', async () => {
  vi.mocked(createClient).mockResolvedValue({
    auth: {
      getUser: () =>
        Promise.resolve({
          data: { user: { id: 'user-1', email: 'a@b.co' } },
          error: null,
        }),
    },
    from: (table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({
                  data: { user_id: 'coolhandle', email: 'a@b.co' },
                  error: null,
                }),
            }),
          }),
        }
      }
      const result = { data: [] as unknown[], error: null }
      const query: any = new Proxy(function () {}, {
        get(_target, prop) {
          if (prop === 'then') {
            return (onFulfilled: (value: typeof result) => unknown) =>
              Promise.resolve(result).then(onFulfilled)
          }
          return query
        },
        apply() {
          return query
        },
      })
      return query
    },
  } as any)

  render(await UserPage())

  expect(screen.getByRole('link', { name: /put one up/i })).toHaveAttribute('href', '/sell')
})
