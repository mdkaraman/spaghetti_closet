'use client'

import { useSearchParams } from 'next/navigation'
import { signup } from '@/app/actions/auth'

export default function SignupForm() {
  const searchParams = useSearchParams()
  const error = searchParams?.get('error') ?? null

  return (
    <form className="signup-form" action={signup}>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="form-row">
        <label htmlFor="userid">user id:</label>
        <input type="text" id="userid" name="userid" required />
      </div>
      <div className="form-row">
        <label htmlFor="email">email:</label>
        <input type="email" id="email" name="email" required />
      </div>
      <div className="form-row">
        <label htmlFor="passcode">passcode:</label>
        <input type="password" id="passcode" name="passcode" required minLength={6} />
      </div>
      <div className="form-row">
        <label htmlFor="confirm">confirm:</label>
        <input type="password" id="confirm" name="confirm" required minLength={6} />
      </div>
      <div className="signup-submit">
        <button type="submit">send it</button>
      </div>
    </form>
  )
}
