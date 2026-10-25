'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const MIN_DOLLARS = 1
const MAX_CENTS = 2_147_483_647

function dollarsToCents(raw: string): number | null {
  const trimmed = raw.trim()
  if (!/^\d+(\.0+)?$/.test(trimmed)) return null
  const dollars = Number(trimmed)
  if (!Number.isInteger(dollars) || dollars < MIN_DOLLARS) return null
  const cents = dollars * 100
  if (!Number.isSafeInteger(cents) || cents > MAX_CENTS) return null
  return cents
}

function field(formData: FormData, name: string): string {
  const value = formData.get(name)
  return typeof value === 'string' ? value : ''
}

function bidError(jontId: string, message: string): never {
  const jont = jontId ? `jont=${encodeURIComponent(jontId)}&` : ''
  redirect(`/bid?${jont}error=${encodeURIComponent(message)}`)
}

export async function placeBid(formData: FormData) {
  const jontId = field(formData, 'jont').trim()
  const cents = dollarsToCents(field(formData, 'amount'))

  if (!jontId) {
    bidError('', 'no jont')
  }

  if (cents == null) {
    bidError(jontId, 'whole dollars, $1 minimum')
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const { data: existing, error: readError } = await supabase
    .from('bids')
    .select('id')
    .eq('jont_id', jontId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (readError) {
    bidError(jontId, 'couldn’t save that bid')
  }

  if (existing) {
    // Amount only. The first created_at stays (the keep_bid_identity trigger pins it too).
    const amountOnly: { amount_cents: number } = { amount_cents: cents }
    const { error } = await supabase
      .from('bids')
      .update(amountOnly)
      .eq('id', existing.id)
      .eq('user_id', user.id)

    if (error) {
      bidError(jontId, 'couldn’t save that bid')
    }
  } else {
    const row: { jont_id: string; user_id: string; amount_cents: number } = {
      jont_id: jontId,
      user_id: user.id,
      amount_cents: cents,
    }
    const { error } = await supabase.from('bids').insert(row)

    if (error) {
      bidError(jontId, 'couldn’t save that bid')
    }
  }

  redirect(`/chat?jont=${encodeURIComponent(jontId)}`)
}
