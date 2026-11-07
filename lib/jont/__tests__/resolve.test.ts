import { beforeEach, expect, test, vi } from 'vitest'
import type { JontCandidate } from '../resolve'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/date', () => ({
  todayEastCoast: vi.fn(() => '2026-11-07'),
}))

const { createClient } = await import('@/lib/supabase/server')
const { pickJontForPrefs, resolveJontForUser } = await import('../resolve')

const TODAY = '2026-11-07'

function candidate(
  overrides: Partial<JontCandidate> & Pick<JontCandidate, 'id'>
): JontCandidate {
  return {
    date: TODAY,
    title: overrides.title ?? overrides.id,
    description: null,
    image_url: null,
    price_cents: 2000,
    created_at: '2026-11-07T12:00:00Z',
    size: null,
    jont_type: null,
    ...overrides,
  }
}

test('a size and type match wins over a jont that does not match', () => {
  const shirtL = candidate({
    id: 'shirt-l',
    title: 'the L shirt',
    created_at: '2026-11-07T13:00:00Z',
    size: 'L',
    jont_type: 'shirt',
  })
  const shoesM = candidate({
    id: 'shoes-m',
    title: 'the M shoes',
    created_at: '2026-11-07T12:00:00Z',
    size: 'M',
    jont_type: 'shoes',
  })

  expect(
    pickJontForPrefs([shoesM, shirtL], { size: 'L', jontType: 'shirt' })
  ).toEqual({
    id: 'shirt-l',
    date: TODAY,
    title: 'the L shirt',
    description: null,
    image_url: null,
    price_cents: 2000,
    created_at: '2026-11-07T13:00:00Z',
  })
})

test('a jont with no size or type matches any preference', () => {
  const open = candidate({
    id: 'open',
    title: 'the open jont',
    size: null,
    jont_type: null,
  })
  const other = candidate({
    id: 'other',
    title: 'the other jont',
    created_at: '2026-11-07T11:00:00Z',
    size: 'S',
    jont_type: 'pants',
  })

  expect(
    pickJontForPrefs([other, open], { size: 'L', jontType: 'shirt' })
  ).toMatchObject({ id: 'open', title: 'the open jont' })
})

test('empty preferences pick the earliest created_at then the lowest id', () => {
  const later = candidate({
    id: 'aaa',
    created_at: '2026-11-07T13:00:00Z',
    size: 'S',
    jont_type: 'shoes',
  })
  const earlierHighId = candidate({
    id: 'zzz',
    created_at: '2026-11-07T12:00:00Z',
    size: 'XL',
    jont_type: 'pants',
  })
  const earlierLowId = candidate({
    id: 'mmm',
    created_at: '2026-11-07T12:00:00Z',
    size: 'M',
    jont_type: 'shirt',
  })

  expect(
    pickJontForPrefs([later, earlierHighId, earlierLowId], {
      size: null,
      jontType: null,
    })
  ).toMatchObject({ id: 'mmm' })
})

test('no jont for today returns null', () => {
  expect(pickJontForPrefs([], { size: 'L', jontType: 'shirt' })).toBeNull()
})

function mockClient({
  jonts = [] as JontCandidate[],
  jontsError = null as { message: string } | null,
  user = { id: 'user-1' } as { id: string } | null,
  profile = { size: 'L', jont_type: 'shirt' } as {
    size: string | null
    jont_type: string | null
  } | null,
} = {}) {
  const from = vi.fn((table: string) => {
    if (table === 'jonts') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: jonts, error: jontsError }),
        }),
      }
    }
    return {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: profile, error: null }),
        }),
      }),
    }
  })

  vi.mocked(createClient).mockResolvedValue({
    auth: {
      getUser: async () => ({ data: { user }, error: null }),
    },
    from,
  } as never)
}

beforeEach(() => {
  vi.clearAllMocks()
})

test('resolveJontForUser returns the matching jont for saved size and type', async () => {
  const shirtL = candidate({
    id: 'shirt-l',
    title: 'the L shirt',
    size: 'L',
    jont_type: 'shirt',
  })
  const shoes = candidate({
    id: 'shoes',
    title: 'the shoes',
    created_at: '2026-11-07T11:00:00Z',
    size: 'L',
    jont_type: 'shoes',
  })
  mockClient({ jonts: [shoes, shirtL] })

  await expect(resolveJontForUser()).resolves.toMatchObject({
    id: 'shirt-l',
    title: 'the L shirt',
  })
})

test('resolveJontForUser returns null when today has no jont', async () => {
  mockClient({ jonts: [] })

  await expect(resolveJontForUser()).resolves.toBeNull()
})
