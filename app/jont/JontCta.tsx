import Link from 'next/link'
import { JONT_ENTRY_MODE, jontEntry } from '@/lib/jont/entry'

type Props = {
  jontId: string
  hasPurchase?: boolean
}

export default function JontCta({ jontId, hasPurchase = false }: Props) {
  const result = jontEntry({ mode: JONT_ENTRY_MODE, hasPurchase })

  if (result === 'chat') {
    return (
      <Link href={`/chat?jont=${jontId}`} className="jont-link">
        pull up
      </Link>
    )
  }

  if (result === 'bid') {
    return (
      <Link href={`/bid?jont=${jontId}`} className="jont-link">
        i will have it!
      </Link>
    )
  }

  return (
    <Link href="/pay" className="jont-link">
      i will have it!
    </Link>
  )
}
