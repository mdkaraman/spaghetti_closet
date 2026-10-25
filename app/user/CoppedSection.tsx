import { createClient } from '@/lib/supabase/server'

type CoppedJont = {
  title: string | null
  date: string
  image_url: string | null
  price_cents: number | null
}

function priceLabel(cents: number | null): string | null {
  if (cents == null) return null
  return `$${(cents / 100).toFixed(0)}`
}

function asJont(value: CoppedJont | CoppedJont[] | null): CoppedJont | null {
  if (!value) return null
  return Array.isArray(value) ? value[0] ?? null : value
}

export default async function CoppedSection({ userId }: { userId: string }) {
  const supabase = await createClient()
  const { data: purchases } = await supabase
    .from('purchases')
    .select('created_at, jonts(title, date, image_url, price_cents)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  const copped = (purchases ?? []).flatMap((row) => {
    const jont = asJont(row.jonts as CoppedJont | CoppedJont[] | null)
    if (!jont) return []
    return [{ ...jont, created_at: row.created_at as string }]
  })

  return (
    <>
      <h2 className="user-heading">you copped it</h2>
      {copped.length === 0 ? (
        <p className="user-empty">nothing yet</p>
      ) : (
        <ul className="user-copped">
          {copped.map((jont) => {
            const price = priceLabel(jont.price_cents)
            return (
              <li key={jont.created_at} className="user-copped-item">
                {jont.image_url ? (
                  <img
                    src={jont.image_url}
                    alt={jont.title ?? 'jont'}
                    className="user-copped-image"
                  />
                ) : null}
                <div>
                  <span className="user-copped-title">{jont.title ?? 'jont'}</span>
                  <span className="user-copped-meta">
                    {price ? `${jont.date} · ${price}` : jont.date}
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
