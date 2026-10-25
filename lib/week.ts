import type { SupabaseClient } from '@supabase/supabase-js'

export type SiteWindow = 'live' | 'dark'

export type SiteWeekRow = {
  starts_on: string
  ends_on: string
  status: string
}

export function siteStatus(
  _rows: readonly SiteWeekRow[],
  _today: string
): SiteWindow {
  return 'live'
}

export async function getSiteWindow(
  _supabase: SupabaseClient
): Promise<SiteWindow> {
  return 'live'
}
