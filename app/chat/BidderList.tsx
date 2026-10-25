import { createClient } from '@/lib/supabase/server'

export type Bidder = {
  userId: string
  handle: string
  amountCents: number
}

type BidRow = {
  user_id: string
  amount_cents: number
  created_at: string
}

type HandleRow = {
  id: string
  user_id: string
}

function dollars(amountCents: number): string {
  return `$${(amountCents / 100).toFixed(0)}`
}

export function BidderListView({ bidders }: { bidders: Bidder[] }) {
  return (
    <section>
      <h2 className="user-heading">bids</h2>
      {bidders.length === 0 ? (
        <p className="user-empty">no bids yet</p>
      ) : (
        <ul className="user-copped">
          {bidders.map((bidder) => (
            <li key={bidder.userId} className="user-copped-item">
              <span className="user-copped-title">{bidder.handle}</span>
              <span className="user-copped-meta">{dollars(bidder.amountCents)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default async function BidderList({ jontId }: { jontId: string }) {
  if (!jontId) return null

  const supabase = await createClient()
  const { data: bids, error } = await supabase
    .from('bids')
    .select('user_id, amount_cents, created_at')
    .eq('jont_id', jontId)
    .order('amount_cents', { ascending: false })
    .order('created_at', { ascending: true })

  const rows = (bids ?? []) as BidRow[]
  if (error || rows.length === 0) {
    return <BidderListView bidders={[]} />
  }

  const userIds = rows.map((bid) => bid.user_id)
  const { data: handles } = await supabase
    .from('profile_handles')
    .select('id, user_id')
    .in('id', userIds)

  const handleById = new Map(
    ((handles ?? []) as HandleRow[]).map((row) => [row.id, row.user_id])
  )

  return (
    <BidderListView
      bidders={rows.map((bid) => ({
        userId: bid.user_id,
        handle: handleById.get(bid.user_id) ?? '—',
        amountCents: bid.amount_cents,
      }))}
    />
  )
}
