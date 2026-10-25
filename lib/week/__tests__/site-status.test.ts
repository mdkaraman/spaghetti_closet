import { expect, test, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { todayEastCoast } from '@/lib/date'
import { getSiteWindow, siteStatus, type SiteWeekRow } from '@/lib/week'

vi.mock('@/lib/date', () => ({
  todayEastCoast: vi.fn(() => '2026-11-05'),
}))

const weekOfNov2: SiteWeekRow = {
  starts_on: '2026-11-02',
  ends_on: '2026-11-09',
  status: 'live',
}

function clientReturning(result: {
  data: SiteWeekRow[] | null
  error: { message: string } | null
}) {
  const select = vi.fn().mockResolvedValue(result)
  const from = vi.fn().mockReturnValue({ select })
  return {
    supabase: { from } as unknown as SupabaseClient,
    from,
    select,
  }
}

test('no site_weeks rows is live', () => {
  expect(siteStatus([], '2026-11-05')).toBe('live')
  expect(siteStatus(null, '2026-11-05')).toBe('live')
})

test('a covering live row is live', () => {
  expect(siteStatus([weekOfNov2], '2026-11-05')).toBe('live')
})

test('a covering dark row is dark', () => {
  expect(
    siteStatus([{ ...weekOfNov2, status: 'dark' }], '2026-11-05')
  ).toBe('dark')
})

test('rows that miss today are dark', () => {
  const past: SiteWeekRow = {
    starts_on: '2026-10-26',
    ends_on: '2026-11-02',
    status: 'live',
  }
  const upcoming: SiteWeekRow = {
    starts_on: '2026-11-09',
    ends_on: '2026-11-16',
    status: 'live',
  }
  expect(siteStatus([past, upcoming], '2026-11-05')).toBe('dark')
})

test('ends_on is exclusive on a seven-day span', () => {
  expect(siteStatus([weekOfNov2], '2026-11-02')).toBe('live')
  expect(siteStatus([weekOfNov2], '2026-11-08')).toBe('live')
  expect(siteStatus([weekOfNov2], '2026-11-09')).toBe('dark')
})

test('a covering live row stays live when another row misses today', () => {
  const past: SiteWeekRow = {
    starts_on: '2026-10-26',
    ends_on: '2026-11-02',
    status: 'dark',
  }
  expect(siteStatus([past, weekOfNov2], '2026-11-05')).toBe('live')
})

test('getSiteWindow queries site_weeks and uses todayEastCoast', async () => {
  const { supabase, from, select } = clientReturning({
    data: [weekOfNov2],
    error: null,
  })

  await expect(getSiteWindow(supabase)).resolves.toBe('live')
  expect(from).toHaveBeenCalledWith('site_weeks')
  expect(select).toHaveBeenCalledWith('starts_on, ends_on, status')
  expect(todayEastCoast).toHaveBeenCalled()
})

test('getSiteWindow is dark when the rows miss today', async () => {
  const { supabase } = clientReturning({
    data: [
      {
        starts_on: '2026-10-26',
        ends_on: '2026-11-02',
        status: 'live',
      },
    ],
    error: null,
  })

  await expect(getSiteWindow(supabase)).resolves.toBe('dark')
})

test('getSiteWindow stays live when the site_weeks read fails', async () => {
  const { supabase } = clientReturning({
    data: null,
    error: { message: 'relation "site_weeks" does not exist' },
  })

  await expect(getSiteWindow(supabase)).resolves.toBe('live')
})
