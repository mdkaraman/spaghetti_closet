'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { requestPasswordReset } from '@/app/actions/forgot-password'

export default function ForgotPasswordPage() {
  const searchParams = useSearchParams()
  const error = searchParams?.get('error') ?? null
  const success = searchParams?.get('success') ?? null

  return (
    <div className="forgot-password-page">
      <h2>forgot passcode</h2>
      {success ? (
        <p className="form-success" role="status">
          Check your email for a link to reset your passcode.
        </p>
      ) : (
        <form className="login-form" action={requestPasswordReset}>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="form-row">
            <label htmlFor="email">email:</label>
            <input type="email" id="email" name="email" required />
          </div>
          <div className="enter-link">
            <button type="submit">send reset link</button>
          </div>
        </form>
      )}
      <p className="forgot-back">
        <Link href="/">back to login</Link>
      </p>
    </div>
  )
}
