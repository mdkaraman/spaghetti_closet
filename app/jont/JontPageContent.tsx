import Link from 'next/link'
import type { JontRow } from '@/lib/jont'

type Props = { jont: JontRow | null }

export default function JontPageContent({ jont }: Props) {
  if (!jont) {
    return (
      <>
        <div className="jont-nav">
          <Link href="/user" className="jont-link">my ish</Link>
        </div>
        <div className="jont-page">
          <p className="jont-description">No jont today. Check back tomorrow.</p>
        </div>
      </>
    )
  }

  const priceDisplay = jont.price_cents != null
    ? `$${(jont.price_cents / 100).toFixed(0)}`
    : null

  return (
    <>
      <div className="jont-nav">
        <Link href="/user" className="jont-link">my ish</Link>
      </div>
      <div className="jont-page">
        <div className="jont-image-wrap">
          {priceDisplay && <span className="jont-price-star">{priceDisplay}</span>}
          <img
            src={jont.image_url || '/hoodie.png'}
            alt={jont.title || 'Jont'}
            className="jont-hoodie"
          />
        </div>
        <p className="jont-description">
          {jont.title ?? 'this that hoodie tho'}
          {jont.description && (
            <>
              <br />
              {jont.description}
            </>
          )}
        </p>
        <p className="jont-cta">
          <Link href="/pay" className="jont-link">i will have it!</Link>
        </p>
      </div>
    </>
  )
}
