import { expect, test, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getSiteWindow, siteStatus } from '@/lib/week'

test('siteStatus stub returns live when there are no rows', () => {
  expect(siteStatus([], '2026-11-02')).toBe('live')
})

test('siteStatus stub returns live for a covering dark row', () => {
  expect(siteStatus([
    { starts_on: '2026-11-02', ends_on: '2026-11-09', status: 'dark' },
  ], '2026-11-02')).toBe('live')
})

test('getSiteWindow returns live and does not query', async () => {
  const from = vi.fn()
  const supabase = { from } as unknown as SupabaseClient
  await expect(getSiteWindow(supabase)).resolves.toBe('live')
  expect(from).not.toHaveBeenCalled()
})
