import type { SupabaseClient } from '@supabase/supabase-js'
import { todayEastCoast } from '@/lib/date'

export type SiteWindow = 'live' | 'dark'

export type SiteWeekRow = {
  starts_on: string
  ends_on: string
  status: string
}

/**
 * Pure window for `site_weeks`. `ends_on` is exclusive, so a row from
 * 2026-11-02 to 2026-11-09 covers seven days. No rows stays live: shipping
 * the table does not take the site down. Rows that miss today are dark,
 * including the day `ends_on` itself.
 */
export function siteStatus(
  rows: readonly SiteWeekRow[] | null | undefined,
  today: string
): SiteWindow {
  if (!rows || rows.length === 0) return 'live'

  const covering = rows.filter(
    (row) => row.starts_on <= today && today < row.ends_on
  )
  if (covering.some((row) => row.status === 'live')) return 'live'
  if (covering.some((row) => row.status === 'dark')) return 'dark'
  return 'dark'
}

/**
 * Read every `site_weeks` row with the client passed in (middleware's
 * Supabase client). A failed read stays live so a missing table does not
 * take the site down. `today` is `todayEastCoast()`.
 */
export async function getSiteWindow(supabase: SupabaseClient): Promise<SiteWindow> {
  const { data, error } = await supabase
    .from('site_weeks')
    .select('starts_on, ends_on, status')

  if (error) return 'live'
  return siteStatus(data as SiteWeekRow[] | null, todayEastCoast())
}
