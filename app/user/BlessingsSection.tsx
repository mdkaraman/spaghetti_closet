import { bless } from '@/app/actions/bless'
import { createClient } from '@/lib/supabase/server'
import './preferences.css'

type BlessingRow = {
  id: string
  amount: number
  from_user: string
}

type HandleRow = {
  id: string
  user_id: string
}

export default async function BlessingsSection() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: rows } = await supabase
    .from('blessings')
    .select('id, amount, from_user, created_at')
    .eq('to_user', user.id)
    .order('created_at', { ascending: false })

  const incoming = (rows ?? []) as BlessingRow[]
  const handleById = new Map<string, string>()

  if (incoming.length > 0) {
    const { data: handles } = await supabase
      .from('profile_handles')
      .select('id, user_id')
      .in('id', incoming.map((row) => row.from_user))

    for (const row of (handles ?? []) as HandleRow[]) {
      handleById.set(row.id, row.user_id)
    }
  }

  const blessings = incoming.map((row) => ({
    id: row.id,
    handle: handleById.get(row.from_user) ?? '—',
    amount: row.amount,
  }))

  return (
    <>
      <h2 className="user-heading">blessings</h2>
      <form className="preferences-form" action={bless}>
        <div className="form-row">
          <label htmlFor="handle">handle:</label>
          <input id="handle" name="handle" type="text" required />
        </div>
        <div className="form-row">
          <label htmlFor="amount">amount:</label>
          <input
            id="amount"
            name="amount"
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            required
          />
        </div>
        <button type="submit">bless</button>
      </form>
      {blessings.length > 0 ? (
        <ul className="user-copped">
          {blessings.map((blessing) => (
            <li key={blessing.id} className="user-copped-item">
              <span className="user-copped-title">{blessing.handle}</span>
              <span className="user-copped-meta">{blessing.amount}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </>
  )
}
