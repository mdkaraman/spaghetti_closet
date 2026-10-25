import { createClient } from '@/lib/supabase/server'
import styles from './chat.module.css'

export function handlesFromPurchases(
  purchases: { user_id: string }[],
  handleRows: { id: string; user_id: string }[]
): string[] {
  const handleOf = new Map(handleRows.map((row) => [row.id, row.user_id]))
  return purchases.flatMap((row) => {
    const handle = handleOf.get(row.user_id)
    return handle ? [handle] : []
  })
}

export function CoppedHandles({ handles }: { handles: string[] }) {
  return (
    <section className={styles.copped}>
      <h2 className="user-heading">copped</h2>
      {handles.length === 0 ? (
        <p className="user-empty">nobody copped it yet</p>
      ) : (
        <ul className={styles.list}>
          {handles.map((handle, index) => (
            <li key={`${handle}-${index}`}>{handle}</li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default async function CoppedList({ jontId }: { jontId: string }) {
  if (!jontId) return <CoppedHandles handles={[]} />

  const supabase = await createClient()
  const { data: purchases } = await supabase
    .from('purchases')
    .select('user_id, created_at')
    .eq('jont_id', jontId)
    .order('created_at', { ascending: true })

  const rows = (purchases ?? []).map((row) => ({
    user_id: row.user_id as string,
  }))
  const ids = [...new Set(rows.map((row) => row.user_id))]

  let handleRows: { id: string; user_id: string }[] = []
  if (ids.length > 0) {
    const { data } = await supabase
      .from('profile_handles')
      .select('id, user_id')
      .in('id', ids)
    handleRows = (data ?? []).map((row) => ({
      id: row.id as string,
      user_id: row.user_id as string,
    }))
  }

  return <CoppedHandles handles={handlesFromPurchases(rows, handleRows)} />
}
