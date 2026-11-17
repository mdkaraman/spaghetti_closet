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

type HandleRow = {
  id: string
  user_id: string
}

export default async function WinnerSlot({ jontId }: { jontId: string }) {
  if (!jontId) return null

  const supabase = await createClient()
  const balancesPromise = Promise.resolve(
    supabase.rpc('balances_for_bidders', {
      jont_id: jontId,
    }),
  )
  const jontPromise = Promise.resolve(
    supabase.from('jonts').select('date').eq('id', jontId).maybeSingle(),
  )
  const { data: bids, error } = await supabase
    .from('bids')
    .select('user_id, amount_cents, created_at')
    .eq('jont_id', jontId)

  const rows = (bids ?? []) as BidRow[]
  if (error || rows.length === 0) return null

  const handlesPromise = supabase
    .from('profile_handles')
    .select('id, user_id')
    .in('id', rows.map((row) => row.user_id))

  const [{ data: balances }, { data: handles }, { data: jont }] = await Promise.all([
    balancesPromise,
    handlesPromise,
    jontPromise,
  ])

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

  const handleById = new Map(
    ((handles ?? []) as HandleRow[]).map((row) => [row.id, row.user_id]),
  )
  const handle = handleById.get(winner.userId) ?? '—'
  const jontDate = (jont as { date: string } | null)?.date
  const label = jontDate && todayEastCoast() > jontDate ? 'winner' : 'high bid'

  return (
    <section className={styles.copped}>
      <h2 className="user-heading">{label}</h2>
      <p>{handle}</p>
    </section>
  )
}
