import { beforeEach, expect, test, vi } from 'vitest'
import { placeBid } from '../bid'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/jont', () => ({
  getJontOfTheDay: vi.fn(),
}))

const { createClient } = await import('@/lib/supabase/server')
const { getJontOfTheDay } = await import('@/lib/jont')

const JONT = 'abc-123'
const USER_ID = 'user-1'

function form(amount: string, jont: string = JONT) {
  const fd = new FormData()
  fd.set('jont', jont)
  fd.set('amount', amount)
  return fd
}

beforeEach(() => {
  vi.clearAllMocks()
})

function mockClient({
  user = { id: USER_ID } as { id: string } | null,
  existing = null as { id: string; created_at: string } | null,
  readError = null as { message: string } | null,
  writeError = null as { message: string } | null,
} = {}) {
  const maybeSingle = vi.fn(async () => ({ data: existing, error: readError }))
  const selectUserEq = vi.fn(() => ({ maybeSingle }))
  const selectJontEq = vi.fn(() => ({ eq: selectUserEq }))
  const select = vi.fn(() => ({ eq: selectJontEq }))

  const insert = vi.fn(async () => ({ error: writeError }))

  const updateUserEq = vi.fn(async () => ({ error: writeError }))
  const updateIdEq = vi.fn(() => ({ eq: updateUserEq }))
  const update = vi.fn(() => ({ eq: updateIdEq }))

  vi.mocked(createClient).mockResolvedValue({
    auth: {
      getUser: async () => ({ data: { user }, error: null }),
    },
    from: (table: string) => {
      if (table !== 'bids') throw new Error(`unexpected table ${table}`)
      return { select, insert, update }
    },
  } as any)

  return { select, selectJontEq, selectUserEq, insert, update, updateIdEq, updateUserEq }
}

test('submitting a bid stores dollars as cents and redirects to that jont chat', async () => {
  const { insert, update, select } = mockClient()

  await expect(placeBid(form('20'))).rejects.toThrow(`NEXT_REDIRECT:/chat?jont=${JONT}`)

  expect(insert).toHaveBeenCalledWith({
    jont_id: JONT,
    user_id: USER_ID,
    amount_cents: 2000,
  })
  expect(insert.mock.calls[0][0]).not.toHaveProperty('created_at')
  expect(update).not.toHaveBeenCalled()
  expect(select).toHaveBeenCalledWith('id')
  expect(getJontOfTheDay).not.toHaveBeenCalled()
})

test('$1 is the minimum and stores 100 cents', async () => {
  const { insert } = mockClient()

  await expect(placeBid(form('1'))).rejects.toThrow(`NEXT_REDIRECT:/chat?jont=${JONT}`)

  expect(insert).toHaveBeenCalledWith({
    jont_id: JONT,
    user_id: USER_ID,
    amount_cents: 100,
  })
})

test('a whole dollar with trailing zeros stores cents', async () => {
  const { insert } = mockClient()

  await expect(placeBid(form('20.00'))).rejects.toThrow(`NEXT_REDIRECT:/chat?jont=${JONT}`)

  expect(insert).toHaveBeenCalledWith({
    jont_id: JONT,
    user_id: USER_ID,
    amount_cents: 2000,
  })
})

test('an amount under $1 does not write a bid', async () => {
  const { insert, update } = mockClient()

  await expect(placeBid(form('0'))).rejects.toThrow(
    'NEXT_REDIRECT:/bid?jont=' +
      JONT +
      '&error=' +
      encodeURIComponent('whole dollars, $1 minimum')
  )

  expect(createClient).not.toHaveBeenCalled()
  expect(insert).not.toHaveBeenCalled()
  expect(update).not.toHaveBeenCalled()
})

test('a fractional dollar does not write a bid', async () => {
  const { insert } = mockClient()

  await expect(placeBid(form('1.5'))).rejects.toThrow(/whole%20dollars/)
  expect(createClient).not.toHaveBeenCalled()
  expect(insert).not.toHaveBeenCalled()
})

test('an empty amount does not write a bid', async () => {
  const { insert } = mockClient()

  await expect(placeBid(form(''))).rejects.toThrow(/whole%20dollars/)
  expect(createClient).not.toHaveBeenCalled()
  expect(insert).not.toHaveBeenCalled()
})

test('a negative amount does not write a bid', async () => {
  const { insert } = mockClient()

  await expect(placeBid(form('-3'))).rejects.toThrow(/whole%20dollars/)
  expect(insert).not.toHaveBeenCalled()
})

test('a second submit changes the amount and keeps the original created_at', async () => {
  const originalCreatedAt = '2026-10-25T15:00:00.000Z'
  let existing: { id: string; created_at: string } | null = null
  const stored = { amount_cents: 0, created_at: '' }

  const maybeSingle = vi.fn(async () => ({ data: existing, error: null }))
  const selectUserEq = vi.fn(() => ({ maybeSingle }))
  const selectJontEq = vi.fn(() => ({ eq: selectUserEq }))
  const select = vi.fn(() => ({ eq: selectJontEq }))

  const insert = vi.fn(async (payload: { amount_cents: number }) => {
    expect(payload).not.toHaveProperty('created_at')
    existing = { id: 'bid-1', created_at: originalCreatedAt }
    stored.amount_cents = payload.amount_cents
    stored.created_at = originalCreatedAt
    return { error: null }
  })

  const updateUserEq = vi.fn(async () => ({ error: null }))
  const updateIdEq = vi.fn(() => ({ eq: updateUserEq }))
  const update = vi.fn((payload: { amount_cents: number }) => {
    expect(payload).toEqual({ amount_cents: payload.amount_cents })
    expect(payload).not.toHaveProperty('created_at')
    stored.amount_cents = payload.amount_cents
    return { eq: updateIdEq }
  })

  vi.mocked(createClient).mockResolvedValue({
    auth: {
      getUser: async () => ({ data: { user: { id: USER_ID } }, error: null }),
    },
    from: (table: string) => {
      if (table !== 'bids') throw new Error(`unexpected table ${table}`)
      return { select, insert, update }
    },
  } as any)

  await expect(placeBid(form('20'))).rejects.toThrow(`NEXT_REDIRECT:/chat?jont=${JONT}`)
  expect(stored).toEqual({ amount_cents: 2000, created_at: originalCreatedAt })
  expect(insert).toHaveBeenCalledTimes(1)
  expect(update).not.toHaveBeenCalled()

  await expect(placeBid(form('35'))).rejects.toThrow(`NEXT_REDIRECT:/chat?jont=${JONT}`)
  expect(stored).toEqual({ amount_cents: 3500, created_at: originalCreatedAt })
  expect(update).toHaveBeenCalledTimes(1)
  expect(update).toHaveBeenCalledWith({ amount_cents: 3500 })
  expect(updateIdEq).toHaveBeenCalledWith('id', 'bid-1')
  expect(updateUserEq).toHaveBeenCalledWith('user_id', USER_ID)
  expect(insert).toHaveBeenCalledTimes(1)
  expect(select).toHaveBeenCalledWith('id')
  expect(getJontOfTheDay).not.toHaveBeenCalled()
})

test('a logged-out submit redirects home and does not write', async () => {
  const { insert, update } = mockClient({ user: null })

  await expect(placeBid(form('20'))).rejects.toThrow('NEXT_REDIRECT:/')
  expect(insert).not.toHaveBeenCalled()
  expect(update).not.toHaveBeenCalled()
})

test('a missing jont does not write', async () => {
  const { insert } = mockClient()

  await expect(placeBid(form('20', '   '))).rejects.toThrow(
    'NEXT_REDIRECT:/bid?error=' + encodeURIComponent('no jont')
  )
  expect(createClient).not.toHaveBeenCalled()
  expect(insert).not.toHaveBeenCalled()
})

test('a failed write stays on the bid page', async () => {
  const { insert } = mockClient({ writeError: { message: 'nope' } })

  await expect(placeBid(form('20'))).rejects.toThrow(
    'NEXT_REDIRECT:/bid?jont=' +
      JONT +
      '&error=' +
      encodeURIComponent('couldn’t save that bid')
  )
  expect(insert).toHaveBeenCalled()
})

test('placeBid does not call getJontOfTheDay', async () => {
  mockClient()
  await expect(placeBid(form('4'))).rejects.toThrow(`NEXT_REDIRECT:/chat?jont=${JONT}`)
  expect(getJontOfTheDay).not.toHaveBeenCalled()
})
