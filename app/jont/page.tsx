import Link from 'next/link'

export default function Jont() {
  return (
    <>
      <div className="jont-nav">
        <Link href="/user" className="jont-link">my ish</Link>
      </div>
      <div className="jont-page">
        <div className="jont-image-wrap">
          <span className="jont-price-star">$20</span>
          <img src="/hoodie.png" alt="Hoodie" className="jont-hoodie" />
        </div>
        <p className="jont-description">
          this that hoodie tho
          <br />
          that size L jaunt
        </p>
        <p className="jont-cta">
          <Link href="/pay" className="jont-link">i will have it!</Link>
        </p>
      </div>
    </>
  )
}
