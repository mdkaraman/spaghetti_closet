'use client'

import { useSearchParams } from 'next/navigation'
import { login } from '@/app/actions/auth'

export default function LoginForm() {
  const searchParams = useSearchParams()
  const error = searchParams?.get('error') ?? null

  return (
    <form className="login-form" action={login} method="post">
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="form-row">
        <label htmlFor="userid">user id:</label>
        <input type="text" id="userid" name="userid" />
      </div>
      <div className="form-row">
        <label htmlFor="passcode">passcode:</label>
        <input type="password" id="passcode" name="passcode" />
      </div>
      <div className="enter-link">
        <button type="submit">enter</button>
      </div>
    </form>
  )
}
