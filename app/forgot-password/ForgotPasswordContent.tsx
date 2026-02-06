'use client'

import { useSearchParams } from 'next/navigation'
import { requestPasswordReset } from '@/app/actions/forgot-password'

export default function ForgotPasswordContent() {
  const searchParams = useSearchParams()
  const error = searchParams?.get('error') ?? null
  const success = searchParams?.get('success') ?? null

  return (
    <div className="forgot-password-page">
      {success ? (
        <p className="form-success" role="status">
          peep your email
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
    </div>
  )
}
