'use client'

import { useSearchParams } from 'next/navigation'
import { updatePassword } from '@/app/actions/auth'

export default function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const error = searchParams?.get('error') ?? null

  return (
    <form className="signup-form" action={updatePassword}>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="form-row">
        <label htmlFor="passcode">passcode:</label>
        <input type="password" id="passcode" name="passcode" required minLength={6} />
      </div>
      <div className="form-row">
        <label htmlFor="confirm">confirm:</label>
        <input type="password" id="confirm" name="confirm" required minLength={6} />
      </div>
      <div className="signup-submit">
        <button type="submit">reset password</button>
      </div>
    </form>
  )
}
