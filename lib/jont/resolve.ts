import { todayEastCoast } from '@/lib/date'
import type { JontRow } from '@/lib/jont'
import { createClient } from '@/lib/supabase/server'

export type JontPrefs = {
  size: string | null
  jontType: string | null
}

export type JontCandidate = JontRow & {
  size: string | null
  jont_type: string | null
}

function asPref(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

function dimMatches(userPref: string | null, jontValue: string | null): boolean {
  if (userPref == null) return true
  if (jontValue == null) return true
  return userPref === jontValue
}

function toJontRow(candidate: JontCandidate): JontRow {
  return {
    id: candidate.id,
    date: candidate.date,
    title: candidate.title,
    description: candidate.description,
    image_url: candidate.image_url,
    price_cents: candidate.price_cents,
    created_at: candidate.created_at,
  }
}

export function pickJontForPrefs(
  jonts: readonly JontCandidate[],
  prefs: JontPrefs
): JontRow | null {
  const matched = jonts.filter(
    (jont) =>
      dimMatches(prefs.size, jont.size) && dimMatches(prefs.jontType, jont.jont_type)
  )
  if (matched.length === 0) return null

  const picked = matched.reduce((earliest, jont) => {
    if (jont.created_at < earliest.created_at) return jont
    if (jont.created_at > earliest.created_at) return earliest
    return jont.id < earliest.id ? jont : earliest
  })
  return toJontRow(picked)
}

export async function resolveJontForUser(): Promise<JontRow | null> {
  const today = todayEastCoast()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('jonts')
    .select(
      'id, date, title, description, image_url, price_cents, created_at, size, jont_type'
    )
    .eq('date', today)

  if (error || !data || data.length === 0) return null

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let prefs: JontPrefs = { size: null, jontType: null }
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('size, jont_type')
      .eq('id', user.id)
      .maybeSingle()
    prefs = {
      size: asPref(profile?.size),
      jontType: asPref(profile?.jont_type),
    }
  }

  const candidates: JontCandidate[] = data.map((row) => ({
    id: row.id as string,
    date: row.date as string,
    title: (row.title as string | null) ?? null,
    description: (row.description as string | null) ?? null,
    image_url: (row.image_url as string | null) ?? null,
    price_cents: typeof row.price_cents === 'number' ? row.price_cents : null,
    created_at: row.created_at as string,
    size: asPref(row.size),
    jont_type: asPref(row.jont_type),
  }))

  return pickJontForPrefs(candidates, prefs)
}
