'use client'

import { useSearchParams } from 'next/navigation'
import { submitWaitlistEmail } from '@/app/actions/waitlist'

export default function WaitlistPage() {
  const searchParams = useSearchParams()
  const error = searchParams?.get('error') ?? null
  const success = searchParams?.get('success') ?? null

  return (
    <div className="waitlist-page">
      <p className="waitlist-lyrics">
        <em>
          I never meant to hurt you I never meant to make you cry But tonight
          I&apos;m cleanin&apos; out my closet (Ha)
        </em>
      </p>
      <h2 className="waitlist-heading">lmk when we back up</h2>
      {success ? (
        <p className="waitlist-confirm" role="status">
          Got it. We&apos;ll hit you up when we&apos;re back.
        </p>
      ) : (
        <form className="waitlist-form" action={submitWaitlistEmail}>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="form-row">
            <label htmlFor="email">email:</label>
            <input type="email" id="email" name="email" required />
          </div>
          <button type="submit">send it</button>
        </form>
      )}
    </div>
  )
}
