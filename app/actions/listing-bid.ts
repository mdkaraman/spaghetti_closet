'use server'

import { dollarsToCents } from '@/lib/bids/amount'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

function field(formData: FormData, name: string): string {
  const value = formData.get(name)
  return typeof value === 'string' ? value : ''
}

function listingPath(listingId: string): string {
  return `/sell/${encodeURIComponent(listingId)}`
}

function bidError(listingId: string, message: string): never {
  redirect(`${listingPath(listingId)}?error=${encodeURIComponent(message)}`)
}

export async function placeListingBid(formData: FormData) {
  const listingId = field(formData, 'listing').trim()
  const cents = dollarsToCents(field(formData, 'amount'))

  if (!listingId) {
    redirect('/sell?error=' + encodeURIComponent('no listing'))
  }

  if (cents == null) {
    bidError(listingId, 'whole dollars, $1 minimum')
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const { data: listing, error: readError } = await supabase
    .from('listings')
    .select('seller_id, status')
    .eq('id', listingId)
    .maybeSingle()

  if (readError || !listing) {
    bidError(listingId, 'no listing')
  }

  if (listing.seller_id === user.id) {
    bidError(listingId, 'can’t bid on your own listing')
  }

  if (listing.status !== 'open') {
    bidError(listingId, 'bidding is closed')
  }

  const row: { listing_id: string; user_id: string; amount_cents: number } = {
    listing_id: listingId,
    user_id: user.id,
    amount_cents: cents,
  }
  const { error } = await supabase
    .from('bids')
    .upsert(row, { onConflict: 'listing_id,user_id' })

  if (error) {
    bidError(listingId, 'couldn’t save that bid')
  }

  redirect(listingPath(listingId))
}
