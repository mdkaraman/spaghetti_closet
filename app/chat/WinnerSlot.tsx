import { pickWinner } from '@/lib/bids/winner'
import { todayEastCoast } from '@/lib/date'
import { createClient } from '@/lib/supabase/server'
import styles from './chat.module.css'

type BidRow = {
  user_id: string
  amount_cents: number
  created_at: string
}

type BalanceRow = {
  user_id: string
  balance: number
}

export default async function WinnerSlot({ jontId }: { jontId: string }) {
  if (!jontId) return null

  const supabase = await createClient()
  const { data: bids, error } = await supabase
    .from('bids')
    .select('user_id, amount_cents, created_at')
    .eq('jont_id', jontId)

  const rows = (bids ?? []) as BidRow[]
  if (error || rows.length === 0) return null

  const { data: balances } = await supabase.rpc('balances_for_bidders', {
    jont_id: jontId,
  })
  const balanceByUser = new Map(
    ((balances ?? []) as BalanceRow[]).map((row) => [row.user_id, row.balance]),
  )
  const winner = pickWinner(
    rows.map((row) => ({
      userId: row.user_id,
      amountCents: row.amount_cents,
      createdAt: row.created_at,
    })),
    (userId) => balanceByUser.get(userId) ?? 0,
  )
  if (!winner) return null

  const { data: handleRow } = await supabase
    .from('profile_handles')
    .select('user_id')
    .eq('id', winner.userId)
    .maybeSingle()
  const { data: jont } = await supabase
    .from('jonts')
    .select('date')
    .eq('id', jontId)
    .maybeSingle()

  const handle = (handleRow as { user_id: string } | null)?.user_id ?? '—'
  const jontDate = (jont as { date: string } | null)?.date
  const label = jontDate && todayEastCoast() > jontDate ? 'winner' : 'high bid'

  return (
    <section className={styles.copped}>
      <h2 className="user-heading">{label}</h2>
      <p>{handle}</p>
    </section>
  )
}
