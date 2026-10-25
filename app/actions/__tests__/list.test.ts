import { expect, test, vi } from 'vitest'
import { listPurchase } from '../list'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

const { createClient } = await import('@/lib/supabase/server')

const caller = { id: 'user-1' }

function formData(purchaseId?: string) {
  const fd = new FormData()
  if (purchaseId !== undefined) fd.set('purchase_id', purchaseId)
  return fd
}

function mockSupabase({
  currentUser = caller as { id: string } | null,
  purchase = { id: 'p-1', user_id: 'user-1', jont_id: 'j-1' } as {
    id: string
    user_id: string
    jont_id: string
  } | null,
  purchaseError = null as { message: string } | null,
  existing = null as { id: string } | null,
  existingError = null as { message: string } | null,
  insertError = null as { message: string } | null,
} = {}) {
  const insert = vi.fn(async () => ({ data: null, error: insertError }))
  const purchaseEq = vi.fn()
  const listingEq = vi.fn()
  const from = vi.fn((table: string) => {
    if (table === 'purchases') {
      return {
        select: () => ({
          eq: (column: string, value: string) => {
            purchaseEq(column, value)
            return {
              maybeSingle: () => Promise.resolve({ data: purchase, error: purchaseError }),
            }
          },
        }),
      }
    }
    if (table === 'listings') {
      return {
        select: () => ({
          eq: (column: string, value: string) => {
            listingEq(column, value)
            return {
              maybeSingle: () => Promise.resolve({ data: existing, error: existingError }),
            }
          },
        }),
        insert,
      }
    }
    throw new Error(`unexpected table ${table}`)
  })

  vi.mocked(createClient).mockResolvedValue({
    auth: {
      getUser: () => Promise.resolve({ data: { user: currentUser }, error: null }),
    },
    from,
  } as any)

  return { insert, purchaseEq, listingEq, from }
}

test('redirects home when not logged in', async () => {
  const { from } = mockSupabase({ currentUser: null })

  await expect(listPurchase(formData('p-1'))).rejects.toThrow(/^NEXT_REDIRECT:\/$/)
  expect(from).not.toHaveBeenCalled()
})

test('redirects when no purchase is chosen', async () => {
  const { from } = mockSupabase()

  await expect(listPurchase(formData('  '))).rejects.toThrow(
    'NEXT_REDIRECT:/sell?error=' + encodeURIComponent('pick one')
  )
  expect(from).not.toHaveBeenCalled()
})

test('inserts an open listing for a purchase the caller owns', async () => {
  const { insert, purchaseEq, listingEq } = mockSupabase()

  await expect(listPurchase(formData('p-1'))).rejects.toThrow(/^NEXT_REDIRECT:\/sell$/)
  expect(purchaseEq).toHaveBeenCalledWith('id', 'p-1')
  expect(listingEq).toHaveBeenCalledWith('purchase_id', 'p-1')
  expect(insert).toHaveBeenCalledWith({
    seller_id: 'user-1',
    jont_id: 'j-1',
    purchase_id: 'p-1',
    status: 'open',
  })
})

test('does not list a purchase that belongs to someone else', async () => {
  const { insert } = mockSupabase({
    purchase: { id: 'p-2', user_id: 'someone-else', jont_id: 'j-2' },
  })

  await expect(listPurchase(formData('p-2'))).rejects.toThrow(
    'NEXT_REDIRECT:/sell?error=' + encodeURIComponent('not yours')
  )
  expect(insert).not.toHaveBeenCalled()
})

test('does not list a missing purchase', async () => {
  const { insert } = mockSupabase({ purchase: null })

  await expect(listPurchase(formData('missing'))).rejects.toThrow(
    'NEXT_REDIRECT:/sell?error=' + encodeURIComponent('not yours')
  )
  expect(insert).not.toHaveBeenCalled()
})

test('does not list a purchase that already has a listing', async () => {
  const { insert } = mockSupabase({ existing: { id: 'l-1' } })

  await expect(listPurchase(formData('p-1'))).rejects.toThrow(
    'NEXT_REDIRECT:/sell?error=' + encodeURIComponent('already up')
  )
  expect(insert).not.toHaveBeenCalled()
})

test('redirects with an error when the insert fails', async () => {
  const { insert } = mockSupabase({ insertError: { message: 'nope' } })

  await expect(listPurchase(formData('p-1'))).rejects.toThrow(
    'NEXT_REDIRECT:/sell?error=' + encodeURIComponent('could not list it')
  )
  expect(insert).toHaveBeenCalledOnce()
})
