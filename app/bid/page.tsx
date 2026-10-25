import BidForm from './BidForm'

type Props = {
  searchParams: { jont?: string; error?: string }
}

export default function BidPage({ searchParams }: Props) {
  const jontId = searchParams?.jont ?? ''
  const error = searchParams?.error ?? null

  return (
    <div className="jont-page">
      <BidForm jontId={jontId} error={error} />
    </div>
  )
}
