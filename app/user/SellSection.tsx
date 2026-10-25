import Link from 'next/link'

export default function SellSection() {
  return (
    <>
      <h2 className="user-heading">sell</h2>
      <p className="user-empty">
        <Link href="/sell" className="jont-link">put one up</Link>
      </p>
    </>
  )
}
