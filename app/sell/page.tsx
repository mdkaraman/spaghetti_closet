import Link from 'next/link'
import { listPurchase } from '@/app/actions/list'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

type JontRef = {
  title: string | null
  date: string
}

type PurchaseRow = {
  id: string
  user_id: string
  created_at: string
  jont_id: string
  jonts: JontRef | JontRef[] | null
}

type ListingRow = {
  id: string
  status: string
  purchase_id: string
  created_at: string
  jonts: JontRef | JontRef[] | null
}

function asJont(value: JontRef | JontRef[] | null): JontRef | null {
  if (!value) return null
  return Array.isArray(value) ? value[0] ?? null : value
}

function jontLabel(value: JontRef | JontRef[] | null) {
  const jont = asJont(value)
  return {
    title: jont?.title ?? 'jont',
    date: jont?.date ?? null,
  }
}

export default async function SellPage({
  searchParams,
}: {
  searchParams?: { error?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const { data: purchases } = await supabase
    .from('purchases')
    .select('id, user_id, created_at, jont_id, jonts(title, date)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const { data: listings } = await supabase
    .from('listings')
    .select('id, status, purchase_id, created_at, jonts(title, date)')
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false })

  const listedIds = new Set(
    ((listings ?? []) as ListingRow[]).map((row) => row.purchase_id)
  )
  const unlisted = ((purchases ?? []) as PurchaseRow[]).filter(
    (row) => row.user_id === user.id && !listedIds.has(row.id)
  )
  const open = ((listings ?? []) as ListingRow[]).filter((row) => row.status === 'open')
  const closed = ((listings ?? []) as ListingRow[]).filter((row) => row.status === 'closed')
  const error = typeof searchParams?.error === 'string' ? searchParams.error : ''

  return (
    <div className="user-page">
      <h2 className="user-heading">sell</h2>
      {error ? <p className="form-error">{error}</p> : null}

      <section>
        <h2 className="user-heading">not listed</h2>
        {unlisted.length === 0 ? (
          <p className="user-empty">nothing to sell</p>
        ) : (
          <ul className="user-copped">
            {unlisted.map((row) => {
              const jont = jontLabel(row.jonts)
              return (
                <li key={row.id} className="user-copped-item">
                  <div>
                    <span className="user-copped-title">{jont.title}</span>
                    {jont.date ? <span className="user-copped-meta">{jont.date}</span> : null}
                  </div>
                  <form action={listPurchase}>
                    <input type="hidden" name="purchase_id" value={row.id} />
                    <button type="submit" className="pay-button">list it</button>
                  </form>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <ListingGroup heading="open" empty="none open" rows={open} />
      <ListingGroup heading="closed" empty="none closed" rows={closed} />

      <p className="user-back">
        <Link href="/user" className="jont-link">my ish</Link>
      </p>
    </div>
  )
}

function ListingGroup({
  heading,
  empty,
  rows,
}: {
  heading: string
  empty: string
  rows: ListingRow[]
}) {
  return (
    <section>
      <h2 className="user-heading">{heading}</h2>
      {rows.length === 0 ? (
        <p className="user-empty">{empty}</p>
      ) : (
        <ul className="user-copped">
          {rows.map((row) => {
            const jont = jontLabel(row.jonts)
            return (
              <li key={row.id} className="user-copped-item">
                <div>
                  <span className="user-copped-title">{jont.title}</span>
                  {jont.date ? <span className="user-copped-meta">{jont.date}</span> : null}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
