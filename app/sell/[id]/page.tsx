import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { closeListingIfDue } from '@/app/actions/close-listing'
import { placeListingBid } from '@/app/actions/listing-bid'
import styles from '@/app/bid/bid.module.css'
import { pickWinner } from '@/lib/bids/winner'
import { createClient } from '@/lib/supabase/server'

type JontRef = {
  title: string | null
  date: string
}

type ListingRow = {
  id: string
  seller_id: string
  status: 'open' | 'closed'
  winner_id: string | null
  jonts: JontRef | JontRef[] | null
}

type BidRow = {
  user_id: string
  amount_cents: number
  created_at: string
}

type BalanceRow = {
  user_id: string
  balance: number
}

type HandleRow = {
  id: string
  user_id: string
}

function asJont(value: JontRef | JontRef[] | null): JontRef | null {
  if (!value) return null
  return Array.isArray(value) ? value[0] ?? null : value
}

function dollars(cents: number): string {
  return `$${cents / 100}`
}

export default async function ListingPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams?: { error?: string }
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  await closeListingIfDue(params.id)

  const { data: listingData } = await supabase
    .from('listings')
    .select('id, seller_id, status, winner_id, jonts(title, date)')
    .eq('id', params.id)
    .maybeSingle()

  if (!listingData) {
    notFound()
  }

  const listing = listingData as ListingRow
  const { data: bidData } = await supabase
    .from('bids')
    .select('user_id, amount_cents, created_at')
    .eq('listing_id', listing.id)
    .order('amount_cents', { ascending: false })
  const bids = (bidData ?? []) as BidRow[]

  const { data: balanceData } = await supabase.rpc('balances_for_listing_bidders', {
    listing_id: listing.id,
  })
  const balanceByUser = new Map(
    ((balanceData ?? []) as BalanceRow[]).map((row) => [row.user_id, row.balance]),
  )

  const { data: handleData } = await supabase
    .from('profile_handles')
    .select('id, user_id')
    .in('id', bids.map((bid) => bid.user_id))
  const handleByUser = new Map(
    ((handleData ?? []) as HandleRow[]).map((row) => [row.id, row.user_id]),
  )

  const closed = listing.status === 'closed'
  const topUserId = closed
    ? listing.winner_id
    : pickWinner(
        bids.map((bid) => ({
          userId: bid.user_id,
          amountCents: bid.amount_cents,
          createdAt: bid.created_at,
        })),
        (userId) => balanceByUser.get(userId) ?? 0,
      )?.userId ?? null
  const topBid = bids.find((bid) => bid.user_id === topUserId) ?? null

  const jont = asJont(listing.jonts)
  const isSeller = listing.seller_id === user.id
  const error = typeof searchParams?.error === 'string' ? searchParams.error : ''

  return (
    <div className="user-page">
      <h2 className="user-heading">{jont?.title ?? 'jont'}</h2>
      {jont?.date ? <p className="user-copped-meta">{jont.date}</p> : null}
      <p>status: {listing.status}</p>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}

      <section>
        <h2 className="user-heading">{closed ? 'winner' : 'high bid'}</h2>
        {topBid ? (
          <p>
            {handleByUser.get(topBid.user_id) ?? '—'} {dollars(topBid.amount_cents)}
          </p>
        ) : (
          <p className="user-empty">no bids</p>
        )}
      </section>

      {closed ? null : isSeller ? (
        <p className="user-empty">your listing</p>
      ) : (
        <form action={placeListingBid} className={styles.form}>
          <input type="hidden" name="listing" value={listing.id} />
          <div className="form-row">
            <label htmlFor="amount">dollars:</label>
            <input
              id="amount"
              name="amount"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              required
              className={styles.amount}
            />
          </div>
          <button type="submit" className="pay-button">
            bid
          </button>
        </form>
      )}

      <section>
        <h2 className="user-heading">bids</h2>
        {bids.length === 0 ? (
          <p className="user-empty">no bids</p>
        ) : (
          <ul className="user-copped">
            {bids.map((bid) => (
              <li key={bid.user_id} className="user-copped-item">
                <span className="user-copped-title">
                  {handleByUser.get(bid.user_id) ?? '—'}
                </span>
                <span className="user-copped-meta">{dollars(bid.amount_cents)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="user-back">
        <Link href="/sell" className="jont-link">sell</Link>
      </p>
    </div>
  )
}
